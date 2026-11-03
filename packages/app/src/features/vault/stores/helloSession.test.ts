import { deviceStore } from '@so/core'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { fakeAuthenticator } from '../testing/fakePasskeys'
import { freshDevice, page, restart } from '../testing/sessionPages'

const PASSWORD = 'correct horse'

let authenticator: ReturnType<typeof fakeAuthenticator>

async function withHello() {
    restart()
    const first = await page()
    await first.session.create('Main', PASSWORD)
    const id = first.session.vault?.id ?? ''
    await vi.waitFor(() => expect(first.security.hello).toBe('off'))
    expect(await first.security.enableHello(PASSWORD)).toBe('ok')
    return { ...first, id }
}

beforeEach(async () => {
    authenticator = fakeAuthenticator()
    await freshDevice()
})

afterEach(() => {
    authenticator.restore()
    vi.unstubAllGlobals()
})

it('turns Hello on behind the master password and opens the vault with the passkey after a restart', async () => {
    const { security, id } = await withHello()
    expect(security.hello).toBe('on')
    // The disk keeps the secret sealed under the PRF key, never the PRF output.
    const slots = await deviceStore.get(id)
    expect(slots?.prf?.credentialId).toBeDefined()
    expect(slots?.rearm?.prf?.bits).toBeDefined()

    restart()
    const reloaded = await page()
    expect(reloaded.session.device.get(id)?.prf).toBe(true)
    expect(await reloaded.session.unlock({ method: 'bio' }, id)).toBe('opened')
    reloaded.session.open()
    expect(reloaded.session.contents).not.toBeNull()
})

it('refuses a wrong master password before the platform prompt', async () => {
    restart()
    const { session, security } = await page()
    await session.create('Main', PASSWORD)
    await vi.waitFor(() => expect(security.hello).toBe('off'))

    expect(await security.enableHello('nope')).toBe('wrong')
    expect(authenticator.calls.create).toHaveLength(0)
    expect(security.hello).toBe('off')
})

it('leaves Hello off when the prompt is closed, and says when it cannot be used', async () => {
    restart()
    const { session, security } = await page()
    await session.create('Main', PASSWORD)
    await vi.waitFor(() => expect(security.hello).toBe('off'))

    authenticator.cancel()
    expect(await security.enableHello(PASSWORD)).toBe('cancelled')
    expect(security.hello).toBe('off')

    authenticator.restore()
    authenticator = fakeAuthenticator({ prf: 'none' })
    const other = await page()
    await other.session.load()
    expect(other.security.hello).toBe('unavailable')
    expect(await other.security.enableHello(PASSWORD)).toBe('unavailable')
})

it('refuses a passkey without PRF output, as a password manager makes in Safari, and keeps no slot', async () => {
    authenticator.restore()
    authenticator = fakeAuthenticator({
        prf: 'none',
        capabilities: { passkeyPlatformAuthenticator: true },
        uvpaa: false,
    })
    const { session, security } = await page()
    await session.create('Main', PASSWORD)
    await vi.waitFor(() => expect(security.hello).toBe('off'))

    expect(await security.enableHello(PASSWORD)).toBe('no-prf')
    expect(security.hello).toBe('off')
    expect(
        (await deviceStore.get(session.vault?.id ?? ''))?.prf,
    ).toBeUndefined()
})

it('keeps Hello working through a master password change, and turning it off asks nothing', async () => {
    const { session, security, id } = await withHello()
    expect(await session.changePassword(PASSWORD, 'new one')).toBe(true)
    session.lock()
    expect(await session.unlock({ method: 'bio' }, id)).toBe('opened')
    session.open()

    await security.disableHello()
    expect(security.hello).toBe('off')
    expect((await deviceStore.get(id))?.prf).toBeUndefined()
    session.lock()
    expect(await session.unlock({ method: 'bio' }, id)).toBe('wrong')
})

it('answers wrong when the user closes the unlock prompt', async () => {
    const { session, id } = await withHello()
    session.lock()
    authenticator.cancel()
    expect(await session.unlock({ method: 'bio' }, id)).toBe('wrong')
    authenticator.cancel(false)
    expect(await session.unlock({ method: 'bio' }, id)).toBe('opened')
})

it('re-arms the passkey from the master password after a restart with Master password after restart', async () => {
    const { session, policy, id } = await withHello()
    await policy.setMasterAfterRestart(true)
    expect((await deviceStore.get(id))?.prf).toBeUndefined()
    expect((await deviceStore.get(id))?.rearm?.prf).toBeDefined()
    session.lock()
    expect(await session.unlock({ method: 'bio' }, id)).toBe('opened')

    restart()
    const reloaded = await page()
    expect(reloaded.session.device.get(id)?.prf).toBeUndefined()
    expect(await reloaded.session.unlock({ method: 'bio' }, id)).toBe('wrong')
    expect(
        await reloaded.session.unlock({ method: 'pw', password: PASSWORD }, id),
    ).toBe('opened')
    expect(reloaded.session.device.get(id)?.prf).toBe(true)
    reloaded.session.lock()
    expect(await reloaded.session.unlock({ method: 'bio' }, id)).toBe('opened')
})
