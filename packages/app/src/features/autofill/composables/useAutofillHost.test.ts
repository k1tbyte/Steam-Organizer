import 'fake-indexeddb/auto'

import { vaultStore } from '@so/core'

import { createPinia } from 'pinia'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createApp, effectScope } from 'vue'

import { PLATFORM, sessionArea, startMocks, writeStored } from '#core'
import {
    type AutoLock,
    useAutoLock,
    useLockPolicy,
    useVaultSession,
} from '#features/vault'
import { useAccountLocks } from '../../accounts/composables/secrets/useAccountLocks'
import { useEditSecret } from '../../accounts/composables/secrets/useEditSecret'
import { useVaultAccounts } from '../../accounts/composables/useVaultAccounts'

import { steamGuardCode } from '../../steam-guard/services/guardCode'
import { readActive, readKept } from '../../vault/services/device/keptEntry'
import { freshDevice } from '../../vault/testing/sessionPages'
import type { HostHandler } from '../model'
import { tabFillKey } from '../services/tabFills'
import { useAutofillHost } from './useAutofillHost'

// The facades export SFCs, which a node test cannot load: the host's own imports come straight from their files.
vi.mock('#features/accounts', async () => ({
    useAccountCredentials: (
        await import('../../accounts/composables/secrets/useAccountCredentials')
    ).useAccountCredentials,
    useVaultAccounts: (
        await import('../../accounts/composables/useVaultAccounts')
    ).useVaultAccounts,
}))
vi.mock('#features/steam-guard', async () => ({
    useGuardCodes: (await import('../../steam-guard/composables/useGuardCodes'))
        .useGuardCodes,
}))

const PASSWORD = 'correct horse'
const SHARED = btoa('0123456789abcdefghij')
const NOW = 1_700_000_000_000
const SECOND = 1000
const STATE = { type: 'autofill:state' }
const login = (id: string) => ({ type: 'autofill:login', id })
const code = (id: string) => ({ type: 'autofill:code', id })

// One page of the browser: its own Pinia and app over the shared IndexedDB, session area and localStorage.
function newPage() {
    const pinia = createPinia()
    const app = createApp({})
        .use(pinia)
        .provide(PLATFORM, { kind: 'extension', fetch: null, google: null })
    return {
        app,
        session: useVaultSession(pinia),
        policy: useLockPolicy(pinia),
        use: <T>(fn: () => T) => app.runWithContext(fn),
    }
}

// The app page: it makes the vault and edits it.
async function appPage(lockAfter: '15m' | '1m' | 'now' = '15m') {
    const page = newPage()
    await page.session.load()
    await page.policy.setLockAfter(lockAfter)
    await page.session.create('Main', PASSWORD)
    // Immediately keeps nothing.
    if (lockAfter !== 'now')
        await vi.waitFor(async () => expect(await readKept()).toBeDefined())
    return { ...page, accounts: page.use(useVaultAccounts) }
}

type App = Awaited<ReturnType<typeof appPage>>

async function addAccount(app: App, login: string, guard = false) {
    const result = await app.accounts.add({
        login,
        password: `${login}-secret`,
        steamId: null,
        ...(guard && {
            authenticator: {
                sharedSecret: SHARED,
                identitySecret: '',
                revocationCode: '',
                maFile: {},
            },
        }),
    })
    expect(result).toBe('added')
    return app.accounts.accounts.value.find((a) => a.login === login)
        ?.id as string
}

const scopes: Array<() => void> = []
function stopHosts() {
    for (const stop of scopes.splice(0)) stop()
}

interface Row {
    id: string
    login: string
    locked: boolean
    guard: boolean
}
interface Reply {
    state: string
    accounts: Row[]
    guardFor?: string
    login?: string
    password?: string
    code?: string
    refused?: string
}

// A vault host: the composable behind a captured transport. A fake lock unless the test wants the real one.
function hostPage(real = false) {
    const page = newPage()
    const scope = effectScope()
    scopes.push(() => scope.stop())
    const fake = { check: vi.fn(async () => {}), touch: vi.fn(async () => {}) }
    let handler: HostHandler | undefined
    scope.run(() =>
        page.use(() => {
            const lock: AutoLock = real ? useAutoLock({ hidden: true }) : fake
            useAutofillHost((serve) => {
                handler = serve
                return () => {}
            }, lock)
        }),
    )
    return {
        ...page,
        autoLock: fake,
        ask: (message: unknown, tab = 1) =>
            handler?.(message, tab) as Promise<Reply>,
    }
}

beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: NOW })
    vi.stubGlobal('window', new EventTarget())
    vi.stubGlobal(
        'document',
        Object.assign(new EventTarget(), { visibilityState: 'visible' }),
    )
    await freshDevice()
})

afterEach(() => {
    stopHosts()
    startMocks(false)
    vi.useRealTimers()
    vi.unstubAllGlobals()
})

it('says there is no vault on a new device, and a locked one when every page is locked', async () => {
    expect(await hostPage().ask(STATE)).toEqual({ state: 'new', accounts: [] })

    const app = await appPage()
    await addAccount(app, 'one')
    app.session.lock()
    expect(await hostPage().ask(STATE)).toEqual({
        state: 'locked',
        accounts: [],
    })
})

it('lists the open vault as picker rows, and nothing else of an account', async () => {
    const app = await appPage()
    const guarded = await addAccount(app, 'two', true)
    await app.accounts.edit(guarded, { note: 'private note' })
    const host = hostPage()
    const answer = await host.ask(STATE)
    expect(answer.state).toBe('unlocked')
    expect(answer.accounts).toHaveLength(1)
    const row = answer.accounts[0] as Row
    expect(row).toMatchObject({
        id: guarded,
        nickname: 'two',
        login: 'two',
        guard: true,
        locked: false,
        pinned: false,
        anonymous: true,
    })
    expect(Object.keys(row).sort()).toEqual(
        [
            'anonymous',
            'guard',
            'hue',
            'id',
            'level',
            'locked',
            'login',
            'nickname',
            'pinned',
        ].sort(),
    )
    const text = JSON.stringify(answer)
    for (const secret of ['two-secret', 'private note', SHARED])
        expect(text).not.toContain(secret)
})

it('fills a login and password and counts it as activity', async () => {
    const app = await appPage()
    const id = await addAccount(app, 'one')
    const host = hostPage()
    expect(await host.ask(login(id), 7)).toEqual({
        login: 'one',
        password: 'one-secret',
    })
    expect(host.autoLock.touch).toHaveBeenCalledTimes(1)
    expect(host.autoLock.check).toHaveBeenCalled()
})

it('refuses a login when the vault locked between the list and the fill', async () => {
    const app = await appPage()
    const id = await addAccount(app, 'one')
    const host = hostPage()
    expect((await host.ask(STATE)).state).toBe('unlocked')

    app.session.lock()
    await vi.waitFor(() => expect(host.session.state).toBe('locked'))
    expect(await host.ask(login(id))).toEqual({ refused: 'locked' })
    expect(await host.ask(code(id))).toEqual({ refused: 'locked' })
    expect(host.autoLock.touch).not.toHaveBeenCalled()
})

it('refuses an account with its own password, even after the popup unlocked it', async () => {
    const app = await appPage()
    const id = await addAccount(app, 'one', true)
    await addAccount(app, 'plain')
    await app
        .use(useAccountLocks)
        .setLock(id, 'account password', 'credentials', false)
    const host = hostPage()
    const popup = hostPage()
    await popup.ask(STATE)
    // The popup page asks the account's password: its key is held there, in that page.
    expect(
        await popup
            .use(useAccountLocks)
            .unlock(id, { password: 'account password' }),
    ).toBe(true)
    expect(popup.session.keyOf(id)).toBeDefined()

    const answer = await host.ask(STATE)
    expect(
        answer.accounts.find((row: { id: string }) => row.id === id),
    ).toMatchObject({
        locked: true,
        login: '',
    })
    expect(await host.ask(login(id))).toEqual({ refused: 'account-locked' })
    expect(await host.ask(code(id))).toEqual({ refused: 'account-locked' })
    expect(host.autoLock.touch).not.toHaveBeenCalled()
})

it('refuses an account that is gone, and a code for one with no authenticator', async () => {
    const app = await appPage()
    const plain = await addAccount(app, 'plain')
    const host = hostPage()
    expect(await host.ask(login('missing'))).toEqual({ refused: 'gone' })
    expect(await host.ask(code('missing'))).toEqual({ refused: 'gone' })
    // The vault would hand it a stand-in code.
    expect(await host.ask(code(plain))).toEqual({ refused: 'gone' })
})

it('gives the Guard code of the account, from the authenticator the vault keeps', async () => {
    const app = await appPage()
    const id = await addAccount(app, 'two', true)
    const host = hostPage()
    const period = Math.floor(Date.now() / SECOND / 30)
    expect(await host.ask(code(id))).toEqual({
        code: await steamGuardCode(SHARED, period),
    })
    expect(host.autoLock.touch).toHaveBeenCalledTimes(1)
})

it('names the Guard account: the last fill on the tab, across a host restart, else the first with an authenticator', async () => {
    const app = await appPage()
    const plain = await addAccount(app, 'plain')
    const guarded = await addAccount(app, 'guarded', true)
    const first = hostPage()
    expect((await first.ask(STATE, 7)).guardFor).toBe(guarded)

    await first.ask(login(plain), 7)
    // A host that was suspended and started again: the tab's last fill is in the session area.
    stopHosts()
    const restarted = hostPage()
    expect((await restarted.ask(STATE, 7)).guardFor).toBe(plain)
    // Another tab has no fill yet.
    expect((await restarted.ask(STATE, 8)).guardFor).toBe(guarded)

    await restarted.ask({ type: 'autofill:filled', id: guarded }, 8)
    expect((await restarted.ask(STATE, 8)).guardFor).toBe(guarded)
    expect((await restarted.ask(STATE, 7)).guardFor).toBe(plain)
})

it('forgets the last fills at a lock', async () => {
    const app = await appPage()
    const plain = await addAccount(app, 'plain')
    const guarded = await addAccount(app, 'guarded', true)
    const host = hostPage()
    await host.ask(login(plain), 7)
    expect((await host.ask(STATE, 7)).guardFor).toBe(plain)

    app.session.lock()
    await vi.waitFor(() => expect(host.session.state).toBe('locked'))
    // Cleared by the lock itself, before anything asks again.
    await vi.waitFor(async () =>
        expect(await sessionArea().get(tabFillKey(7))).toBeUndefined(),
    )
    expect(await app.session.unlock({ method: 'pw', password: PASSWORD })).toBe(
        'opened',
    )
    app.session.open()
    await vi.waitFor(() => expect(host.session.state).toBe('unlocked'))
    expect((await host.ask(STATE, 7)).guardFor).toBe(guarded)
})

it('forgets the last fills at a lock it slept through', async () => {
    const app = await appPage()
    const plain = await addAccount(app, 'plain')
    const guarded = await addAccount(app, 'guarded', true)
    await hostPage().ask(login(plain), 7)
    // Firefox suspends the host; the lock and the unlock happen in the app meanwhile.
    stopHosts()
    app.session.lock()
    expect(await app.session.unlock({ method: 'pw', password: PASSWORD })).toBe(
        'opened',
    )
    app.session.open()
    expect((await hostPage().ask(STATE, 7)).guardFor).toBe(guarded)
})

it('fills what another page changed: an edit, then a deletion', async () => {
    const app = await appPage()
    const id = await addAccount(app, 'one')
    const host = hostPage()
    expect(await host.ask(login(id))).toMatchObject({ password: 'one-secret' })

    await app.use(useEditSecret)(id, (secret) => ({
        secret: { ...secret, password: 'changed-secret' },
    }))
    expect(await host.ask(login(id))).toMatchObject({
        password: 'changed-secret',
    })

    await app.accounts.remove([id])
    expect(await host.ask(login(id))).toEqual({ refused: 'gone' })
    expect((await host.ask(STATE)).accounts).toEqual([])
})

it('refuses past the idle deadline without a timer firing', async () => {
    const app = await appPage('1m')
    const id = await addAccount(app, 'one')
    const host = hostPage(true)
    expect(await host.ask(login(id))).toMatchObject({ login: 'one' })

    vi.advanceTimersByTime(61 * SECOND)
    expect(await host.ask(login(id))).toEqual({ refused: 'locked' })
    expect((await host.ask(STATE)).state).toBe('locked')
})

it('is locked under Immediately, also when the policy was switched while it ran', async () => {
    const app = await appPage('15m')
    const id = await addAccount(app, 'one')
    const host = hostPage(true)
    expect((await host.ask(STATE)).state).toBe('unlocked')

    await app.policy.setLockAfter('now')
    expect(await host.ask(login(id))).toEqual({ refused: 'locked' })

    // Started under Immediately: nothing was kept to restore.
    expect((await hostPage(true).ask(STATE)).state).toBe('locked')
})

it('stamps the shared activity when it hands out a login', async () => {
    const app = await appPage('15m')
    const id = await addAccount(app, 'one')
    const host = hostPage(true)
    const opened = await readActive()
    vi.advanceTimersByTime(20 * SECOND)
    await host.ask(login(id))
    expect(await readActive()).toBe(Date.now())
    expect(Date.now()).toBeGreaterThan(opened as number)
})

it('answers from the samples in mock mode, with the demo password and code', async () => {
    writeStored(
        'so:mocks',
        JSON.stringify({
            mode: 'mock',
            picks: { 'accounts.list': 'One locked' },
        }),
    )
    startMocks(true)
    const host = hostPage()
    const answer = await host.ask(STATE)
    expect(answer.state).toBe('unlocked')
    const rows = answer.accounts
    expect(rows.length).toBeGreaterThan(2)
    const open = rows.find((row) => !row.locked && row.guard)
    const locked = rows.find((row) => row.locked)
    expect(open).toBeDefined()
    expect(locked?.login).toBe('')

    expect(await host.ask(login(open?.id as string))).toEqual({
        login: open?.login,
        password: '********',
    })
    expect(await host.ask(code(open?.id as string))).toEqual({
        code: expect.stringMatching(/^[2-9B-HJKMNP-RTV-Y]{5}$/),
    })
    expect(await host.ask(login(locked?.id as string))).toEqual({
        refused: 'account-locked',
    })
})

it('leaves a message it does not know unanswered', async () => {
    const host = hostPage()
    expect(await host.ask({ type: 'open-app', path: '/' })).toBeUndefined()
    expect(await host.ask({ type: 'autofill:login' })).toBeUndefined()
    expect(host.autoLock.check).not.toHaveBeenCalled()
})

it('refuses when the lock check cannot decide, and hands out nothing', async () => {
    const app = await appPage()
    const id = await addAccount(app, 'one')
    const host = hostPage()
    host.autoLock.check.mockRejectedValueOnce(new Error('no stamp'))
    await expect(host.ask(login(id))).rejects.toThrow('no stamp')
    expect(host.autoLock.touch).not.toHaveBeenCalled()
})

it('refuses a login when the vault locks while its secret is handed out', async () => {
    const app = await appPage()
    const id = await addAccount(app, 'one')
    const host = hostPage()
    host.autoLock.touch.mockImplementationOnce(async () => host.session.lock())
    expect(await host.ask(login(id))).toEqual({ refused: 'locked' })
})

it('refuses a code when the vault locks while it is handed out', async () => {
    const app = await appPage()
    const id = await addAccount(app, 'two', true)
    const host = hostPage()
    host.autoLock.touch.mockImplementationOnce(async () => host.session.lock())
    expect(await host.ask(code(id))).toEqual({ refused: 'locked' })
})

it('sees a vault another page made after it started', async () => {
    const host = hostPage()
    expect((await host.ask(STATE)).state).toBe('new')

    // Under Immediately nothing is kept to restore: only the vault list says there is one.
    await appPage('now')
    expect((await host.ask(STATE)).state).toBe('locked')
})

it('refuses once the vault it holds was removed from the disk by another page', async () => {
    const app = await appPage('15m')
    const id = await addAccount(app, 'one')
    const host = hostPage()
    expect(await host.ask(login(id))).toMatchObject({ login: 'one' })

    await vaultStore.remove(host.session.vault?.id as string)
    expect(await host.ask(login(id))).toEqual({ refused: 'locked' })
    expect((await host.ask(STATE)).state).toBe('new')
})
