import { deviceStore } from '@so/core'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { sessionArea } from '#core'

import { freshDevice, type Page, page, restart } from '../testing/sessionPages'

const PASSWORD = 'correct horse'
const PIN = '123456'
const WRONG = '654321'

async function withPin(restartBound = true) {
    restart(restartBound)
    const first = await page()
    await first.session.create('Main', PASSWORD)
    const id = first.session.vault?.id ?? ''
    expect(await first.security.setPin(PASSWORD, PIN)).toBe('ok')
    return { ...first, id }
}

const wrongOf = (session: Page['session'], id: string) =>
    session.device.get(id)?.pin?.wrong

beforeEach(freshDevice)

afterEach(() => vi.unstubAllGlobals())

it('sets a PIN behind the master password, and opens the vault with it after a restart', async () => {
    restart()
    const { session, security } = await page()
    await session.create('Main', PASSWORD)
    const id = session.vault?.id ?? ''
    expect(security.pin).toBe('off')

    expect(await security.setPin('nope', PIN)).toBe('wrong')
    expect(security.pin).toBe('off')
    expect(await security.setPin(PASSWORD, PIN)).toBe('ok')
    expect(security.pin).toBe('on')
    // The disk holds the slot sealed under the PIN's key and the material to rebuild it, never the PIN.
    const slots = await deviceStore.get(id)
    expect(slots?.pin?.wrong).toBe(0)
    expect(slots?.rearm?.pin?.bits).toBeDefined()
    expect(JSON.stringify(slots)).not.toContain(PIN)

    restart()
    const reloaded = await page()
    expect(reloaded.session.state).toBe('locked')
    expect(reloaded.session.device.get(id)?.pin).toEqual({ wrong: 0 })
    expect(await reloaded.session.unlock({ method: 'pin', pin: PIN }, id)).toBe(
        'opened',
    )
    reloaded.session.open()
    expect(reloaded.session.contents).not.toBeNull()
})

it('counts wrong PINs with the slot, pauses at three and answers wrong without trying', async () => {
    const { id } = await withPin()
    restart()
    const { session } = await page()
    for (const tries of [1, 2, 3]) {
        expect(await session.unlock({ method: 'pin', pin: WRONG }, id)).toBe(
            'wrong',
        )
        expect(wrongOf(session, id)).toBe(tries)
    }
    expect(session.device.get(id)?.pin).toEqual({ wrong: 3 })

    // Paused: even the right PIN is refused, and a reload keeps it paused.
    expect(await session.unlock({ method: 'pin', pin: PIN }, id)).toBe('wrong')
    const reloaded = await page()
    expect(reloaded.session.device.get(id)?.pin).toEqual({ wrong: 3 })

    // The master password turns it back on and resets the count.
    expect(
        await reloaded.session.unlock({ method: 'pw', password: PASSWORD }, id),
    ).toBe('opened')
    expect(reloaded.session.device.get(id)?.pin).toEqual({ wrong: 0 })
    reloaded.session.lock()
    expect(await reloaded.session.unlock({ method: 'pin', pin: PIN }, id)).toBe(
        'opened',
    )
})

it('shows an open vault its paused PIN once another page used up the tries', async () => {
    const { session, security, policy, id } = await withPin()
    // Immediately keeps no session, so the second page stays locked and can try PINs.
    await policy.setLockAfter('now')
    const other = await page()
    for (const _ of [1, 2, 3])
        await other.session.unlock({ method: 'pin', pin: WRONG }, id)

    expect(security.pin).toBe('on')
    await session.refreshDevice([id])
    expect(security.pin).toBe('paused')
})

it('counts the same way where there are no Web Locks', async () => {
    const { session, id } = await withPin()
    session.lock()
    Object.defineProperty(globalThis.navigator, 'locks', {
        value: undefined,
        configurable: true,
    })
    try {
        expect(await session.unlock({ method: 'pin', pin: WRONG }, id)).toBe(
            'wrong',
        )
        expect(wrongOf(session, id)).toBe(1)
        expect(await session.unlock({ method: 'pin', pin: PIN }, id)).toBe(
            'opened',
        )
    } finally {
        Reflect.deleteProperty(globalThis.navigator, 'locks')
    }
})

it('resets the count on a right PIN', async () => {
    const { session, id } = await withPin()
    session.lock()
    await session.unlock({ method: 'pin', pin: WRONG }, id)
    expect(wrongOf(session, id)).toBe(1)
    expect(await session.unlock({ method: 'pin', pin: PIN }, id)).toBe('opened')
    expect(wrongOf(session, id)).toBe(0)
})

it('counts the tries of two pages as one budget', async () => {
    const { id } = await withPin()
    restart()
    const [a, b] = [await page(), await page()]
    const answers = await Promise.all([
        a.session.unlock({ method: 'pin', pin: WRONG }, id),
        b.session.unlock({ method: 'pin', pin: WRONG }, id),
        a.session.unlock({ method: 'pin', pin: WRONG }, id),
        b.session.unlock({ method: 'pin', pin: PIN }, id),
    ])
    expect(answers).toEqual(['wrong', 'wrong', 'wrong', 'wrong'])
    expect((await deviceStore.get(id))?.pin?.wrong).toBe(3)
})

it('keeps the PIN working through a master password change', async () => {
    const { session, id } = await withPin()
    expect(await session.changePassword(PASSWORD, 'new one')).toBe(true)

    restart()
    const reloaded = await page()
    expect(await reloaded.session.unlock({ method: 'pin', pin: PIN }, id)).toBe(
        'opened',
    )
    reloaded.session.open()
    expect(reloaded.session.contents).not.toBeNull()
})

it('removes the PIN with nothing asked, and deletes it with the vault', async () => {
    const { session, security, id } = await withPin()
    await security.removePin()
    expect(security.pin).toBe('off')
    expect(await deviceStore.get(id)).toBeUndefined()
    session.lock()
    expect(await session.unlock({ method: 'pin', pin: PIN }, id)).toBe('wrong')

    expect(await session.unlock({ method: 'pw', password: PASSWORD }, id)).toBe(
        'opened',
    )
    session.open()
    await security.setPin(PASSWORD, PIN)
    await session.remove(id)
    expect(await deviceStore.get(id)).toBeUndefined()
    expect(session.device.get(id)).toBeUndefined()
})

it('re-arms the PIN from the master password after a restart, when it must be asked again', async () => {
    const { session, security, policy, id } = await withPin()
    await policy.setMasterAfterRestart(true)
    // The slot moved to the session area; the disk keeps only the material to rebuild it.
    expect((await deviceStore.get(id))?.pin).toBeUndefined()
    expect((await deviceStore.get(id))?.rearm?.pin).toBeDefined()
    expect(security.pin).toBe('on')
    session.lock()
    expect(await session.unlock({ method: 'pin', pin: PIN }, id)).toBe('opened')

    restart()
    const reloaded = await page()
    expect(reloaded.security.pin).toBe('off')
    expect(await reloaded.session.unlock({ method: 'pin', pin: PIN }, id)).toBe(
        'wrong',
    )
    // One master-password unlock builds it again: the PIN is not asked for twice.
    expect(
        await reloaded.session.unlock({ method: 'pw', password: PASSWORD }, id),
    ).toBe('opened')
    expect(reloaded.session.device.get(id)?.pin).toEqual({ wrong: 0 })
    expect((await deviceStore.get(id))?.pin).toBeUndefined()
    reloaded.session.lock()
    expect(await reloaded.session.unlock({ method: 'pin', pin: PIN }, id)).toBe(
        'opened',
    )

    // Back to remembering it: the slot returns to the disk.
    await reloaded.policy.setMasterAfterRestart(false)
    expect((await deviceStore.get(id))?.pin?.wrong).toBe(0)
})

it('keeps the PIN in page memory only on the web, where no area is bound to the browser', async () => {
    const { session, policy, id } = await withPin(false)
    await policy.setMasterAfterRestart(true)
    expect((await deviceStore.get(id))?.pin).toBeUndefined()
    expect(await sessionArea().get(`so:slots:${id}`)).toBeUndefined()
    session.lock()
    expect(await session.unlock({ method: 'pin', pin: PIN }, id)).toBe('opened')
})
