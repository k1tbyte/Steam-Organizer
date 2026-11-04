import 'fake-indexeddb/auto'

import { createPinia } from 'pinia'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createApp, effectScope } from 'vue'

import { PLATFORM, type Platform, startMocks } from '#core'
import { useVaultSession } from '#features/vault'

import { useVaultAccounts } from '../../accounts/composables/useVaultAccounts'
import { steamGuardCode } from '../../steam-guard/services/guardCode'
import { freshDevice } from '../../vault/testing/sessionPages'
import type { TabRequest } from '../model'
import { useActiveTab } from './useActiveTab'

// The facades export SFCs, which a node test cannot load: the composable's own imports come straight from their files.
vi.mock('#features/accounts', async () => ({
    useAccountCredentials: (
        await import('../../accounts/composables/secrets/useAccountCredentials')
    ).useAccountCredentials,
}))
vi.mock('#features/steam-guard', async () => ({
    useGuardCodes: (await import('../../steam-guard/composables/useGuardCodes'))
        .useGuardCodes,
}))

const SHARED = btoa('0123456789abcdefghij')
const NOW = 1_700_000_000_000
const SIGN_IN = { kind: 'signin', address: 'store.steampowered.com/login' }

// A tab whose content script answers the context and the fills as the test says (undefined: nothing answers).
function tabThatSays(context: unknown, fill?: unknown) {
    const sent: TabRequest[] = []
    const activeTab: Platform['activeTab'] = {
        request: async (message) => {
            sent.push(message as TabRequest)
            return (message as TabRequest).type === 'tab:context'
                ? context
                : fill
        },
    }
    return { sent, activeTab }
}

async function popup(activeTab?: Platform['activeTab'], guard = false) {
    const pinia = createPinia()
    const app = createApp({})
        .use(pinia)
        .provide(PLATFORM, {
            kind: 'extension',
            fetch: null,
            google: null,
            ...(activeTab && { activeTab }),
        })
    await useVaultSession(pinia).create('Main', 'correct horse')
    const { accounts, add } = app.runWithContext(useVaultAccounts)
    await add({
        login: 'one',
        password: 'one-secret',
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
    const account = accounts.value[0]
    if (!account) throw new Error('no account')
    const scope = effectScope()
    const tab = scope.run(() => app.runWithContext(useActiveTab))
    if (!tab) throw new Error('no composable')
    return { ...tab, account, stop: () => scope.stop() }
}

const stops: Array<() => void> = []
async function opened(...args: Parameters<typeof popup>) {
    const page = await popup(...args)
    stops.push(page.stop)
    return page
}

beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: NOW })
    await freshDevice()
})

afterEach(() => {
    for (const stop of stops.splice(0)) stop()
    startMocks(false)
    vi.useRealTimers()
})

it('reads what the active tab shows when the popup opens', async () => {
    const { activeTab } = tabThatSays(SIGN_IN)
    const { tab } = await opened(activeTab)
    await vi.waitFor(() => expect(tab.value).toEqual(SIGN_IN))
})

it('reads a tab nothing answers in as another site, never the sample', async () => {
    startMocks(true)
    const { activeTab } = tabThatSays(undefined)
    const { tab } = await opened(activeTab)
    // Real, even with mocks filling the gaps: a way to the tab was there.
    await vi.waitFor(() => expect(tab.value?.kind).toBe('other'))
})

it('shows the sample only where there is no way to the tab, and sends nothing to it', async () => {
    startMocks(true)
    const { tab, fill, account } = await opened(undefined)
    expect(tab.value?.kind).toBe('signin')
    expect(await fill(account)).toBe('sample')
})

it('fills a sign-in with the login and password', async () => {
    const { activeTab, sent } = tabThatSays(SIGN_IN, { filled: true })
    const { tab, fill, account } = await opened(activeTab)
    await vi.waitFor(() => expect(tab.value?.kind).toBe('signin'))
    expect(await fill(account)).toBe('filled')
    expect(sent).toEqual([
        { type: 'tab:context' },
        {
            type: 'tab:fill-login',
            id: account.id,
            login: 'one',
            password: 'one-secret',
        },
    ])
})

it('fills a Guard prompt with the code of the account', async () => {
    const { activeTab, sent } = tabThatSays(
        { kind: 'guard', address: 'store.steampowered.com/login' },
        { filled: true },
    )
    const { tab, fill, account } = await opened(activeTab, true)
    await vi.waitFor(() => expect(tab.value?.kind).toBe('guard'))
    expect(await fill(account)).toBe('filled')
    const period = Math.floor(NOW / 1000 / 30)
    expect(sent.at(-1)).toEqual({
        type: 'tab:fill-code',
        code: await steamGuardCode(SHARED, period),
    })
})

it('sends no stand-in code for an account of the vault that has no authenticator', async () => {
    const { activeTab, sent } = tabThatSays(
        { kind: 'guard', address: 'store.steampowered.com/login' },
        { filled: true },
    )
    const { tab, fill, account } = await opened(activeTab, false)
    await vi.waitFor(() => expect(tab.value?.kind).toBe('guard'))
    expect(await fill(account)).toBe('missed')
    expect(sent).toEqual([{ type: 'tab:context' }])
})

it('sends nothing to a tab that is not a Steam login', async () => {
    // No content script answers there.
    const { activeTab, sent } = tabThatSays(undefined)
    const { tab, fill, account } = await opened(activeTab)
    expect(sent).toEqual([{ type: 'tab:context' }])
    expect(tab.value?.kind).toBe('other')
    expect(await fill(account)).toBe('missed')
    expect(sent).toEqual([{ type: 'tab:context' }])
})

it('counts a page that had no fields for it as missed', async () => {
    const { activeTab } = tabThatSays(SIGN_IN, { filled: false })
    const { tab, fill, account } = await opened(activeTab)
    await vi.waitFor(() => expect(tab.value?.kind).toBe('signin'))
    expect(await fill(account)).toBe('missed')
})
