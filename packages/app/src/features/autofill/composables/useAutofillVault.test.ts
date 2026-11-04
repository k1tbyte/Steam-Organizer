import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { createAutofillVault } from './useAutofillVault'

type Answer = (answer: unknown) => void

// A host whose answers the test gives, in any order.
function fakeHost() {
    const sent: unknown[] = []
    const waiting: Answer[] = []
    return {
        sent,
        request(message: unknown) {
            sent.push(message)
            return new Promise<unknown>((resolve) => waiting.push(resolve))
        },
        answer: (at: number, value: unknown) => waiting[at]?.(value),
    }
}

const ROW = {
    id: 'a',
    nickname: 'Ash',
    login: 'ash',
    hue: 1,
    level: 2,
    guard: true,
    locked: false,
    pinned: false,
    anonymous: false,
}

beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => vi.restoreAllMocks())

it('knows nothing until the host answers, then holds its list and the Guard account', async () => {
    const host = fakeHost()
    const vault = createAutofillVault(host)
    expect(vault.state.value).toBeUndefined()

    const refreshed = vault.refresh()
    expect(host.sent).toEqual([{ type: 'autofill:state' }])
    host.answer(0, { state: 'unlocked', accounts: [ROW], guardFor: 'a' })
    await refreshed
    expect(vault.state.value).toBe('unlocked')
    expect(vault.accounts.value).toEqual([ROW])
    expect(vault.guardFor.value).toBe('a')
})

it('drops an answer that a newer refresh has overtaken', async () => {
    const host = fakeHost()
    const vault = createAutofillVault(host)
    const older = vault.refresh()
    const newer = vault.refresh()
    host.answer(1, { state: 'locked', accounts: [] })
    await newer
    host.answer(0, { state: 'unlocked', accounts: [ROW] })
    await older
    expect(vault.state.value).toBe('locked')
    expect(vault.accounts.value).toEqual([])
})

it('drops an answer once the picker closed or the target changed', async () => {
    const host = fakeHost()
    const vault = createAutofillVault(host)
    const refreshed = vault.refresh()
    vault.cancel()
    host.answer(0, { state: 'unlocked', accounts: [ROW] })
    await refreshed
    expect(vault.state.value).toBeUndefined()
    expect(vault.accounts.value).toEqual([])
})

it('hands a login to the caller only, and holds none of it', async () => {
    const host = fakeHost()
    const vault = createAutofillVault(host)
    const login = vault.login('a')
    expect(host.sent).toEqual([{ type: 'autofill:login', id: 'a' }])
    host.answer(0, { login: 'ash', password: 'hunter2' })
    expect(await login).toEqual({ login: 'ash', password: 'hunter2' })
    // The password sits in no field of the vault.
    expect(JSON.stringify(vault.accounts.value)).not.toContain('hunter2')
    expect(vault.state.value).toBeUndefined()
    expect(host.sent).toHaveLength(1)
})

it('drops a login whose fill is no longer wanted: the page changed while the host opened it', async () => {
    const host = fakeHost()
    const vault = createAutofillVault(host)
    let wanted = true
    const login = vault.login('a', () => wanted)
    wanted = false
    host.answer(0, { login: 'ash', password: 'hunter2' })
    expect(await login).toBeUndefined()
    // A dropped answer is not a refusal: nothing is read again.
    expect(host.sent).toHaveLength(1)
})

it('reads the list again after a refusal, and passes the refusal on', async () => {
    const host = fakeHost()
    const vault = createAutofillVault(host)
    const login = vault.login('a')
    host.answer(0, { refused: 'locked' })
    // The refusal is held until the list on show is current.
    await vi.waitFor(() => expect(host.sent).toHaveLength(2))
    expect(host.sent[1]).toEqual({ type: 'autofill:state' })
    host.answer(1, { state: 'locked', accounts: [] })
    expect(await login).toEqual({ refused: 'locked' })
    expect(vault.state.value).toBe('locked')
})

it('asks for a code, and reads a refusal of it', async () => {
    const host = fakeHost()
    const vault = createAutofillVault(host)
    const code = vault.code('a')
    expect(host.sent).toEqual([{ type: 'autofill:code', id: 'a' }])
    host.answer(0, { code: 'ABCDE' })
    expect(await code).toEqual({ code: 'ABCDE' })

    const refused = vault.code('a')
    host.answer(1, { refused: 'account-locked' })
    await vi.waitFor(() => expect(host.sent).toHaveLength(3))
    host.answer(2, { state: 'unlocked', accounts: [ROW] })
    expect(await refused).toEqual({ refused: 'account-locked' })
})

it('reads a host out of reach as a locked vault, and a malformed answer as a refusal', async () => {
    const vault = createAutofillVault({
        request: () => Promise.reject(new Error('no receiver')),
    })
    await vault.refresh()
    expect(vault.state.value).toBe('locked')
    expect(vault.accounts.value).toEqual([])

    const silent = createAutofillVault({ request: async () => undefined })
    expect(await silent.login('a')).toEqual({ refused: 'locked' })
    expect(await createAutofillVault(undefined).login('a')).toEqual({
        refused: 'locked',
    })
})

it('tells the host the popup filled an account', async () => {
    const host = fakeHost()
    const vault = createAutofillVault(host)
    const told = vault.filled('a')
    expect(host.sent).toEqual([{ type: 'autofill:filled', id: 'a' }])
    host.answer(0, {})
    await told
})
