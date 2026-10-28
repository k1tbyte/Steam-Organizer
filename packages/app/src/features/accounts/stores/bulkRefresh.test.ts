import 'fake-indexeddb/auto'

import { SteamError, steamApi } from '@so/core'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, expect, it, vi } from 'vitest'

import { useVaultSession } from '#features/vault'

import { useVaultAccounts } from '../composables/useVaultAccounts'
import { useBulkRefreshStore } from './bulkRefresh'

let down = false
let hold: Promise<void> | null = null
let arrived = () => {}

const fetch = (async (input: string | URL | Request) => {
    const held = hold
    if (held) {
        arrived()
        await held
    }
    if (down) return new Response('', { status: 503 })
    const url = new URL(String(input))
    const ids = (url.searchParams.get('steamids') ?? '').split(',')
    const reply: Record<string, unknown> = {
        '/ISteamUser/GetPlayerSummaries/v2/': {
            response: {
                players: ids.map((steamid) => ({
                    steamid,
                    personaname: 'Fresh',
                    avatarhash: '',
                    profileurl: '',
                    communityvisibilitystate: 1,
                })),
            },
        },
        '/ISteamUser/GetPlayerBans/v1/': { players: [] },
    }
    return new Response(JSON.stringify(reply[url.pathname]))
}) as typeof globalThis.fetch

vi.mock('#features/steam', () => ({
    useSteamApi: () => ({
        reachable: true,
        fetch,
        api: async () => steamApi(fetch, 'KEY'),
    }),
}))

beforeEach(async () => {
    down = false
    hold = null
    await new Promise((resolve) => {
        indexedDB.deleteDatabase('steam-organizer').onsuccess = resolve
    })
    setActivePinia(createPinia())
})

async function vaultOf(count: number) {
    const session = useVaultSession()
    await session.create('Main', 'correct horse')
    const vault = useVaultAccounts()
    for (let index = 0; index < count; index++)
        await vault.add({
            login: `login${index}`,
            password: 'hunter22',
            steamId: String(76561198000000001n + BigInt(index)),
        })
    return { session, ids: vault.accounts.value.map((account) => account.id) }
}

/** Starts a run whose first request waits until `release`. */
async function heldRun(ids: string[]) {
    let release = () => {}
    hold = new Promise((resolve) => {
        release = resolve
    })
    const inFlight = new Promise<void>((resolve) => {
        arrived = resolve
    })
    const result = useBulkRefreshStore().start(ids, false)
    await inFlight
    hold = null
    return { result, release }
}

it('skips accounts refreshed within the hour, unless every pick is asked for', async () => {
    const { ids } = await vaultOf(2)
    const store = useBulkRefreshStore()
    expect(await store.start(ids, true)).toMatchObject({ updated: 2, fresh: 0 })
    expect(await store.start(ids, true)).toMatchObject({ updated: 0, fresh: 2 })
    expect(await store.start(ids, false)).toMatchObject({ updated: 2 })
    expect(store.run).toBeNull()
})

it('stops after the batch in flight, naming the accounts it left', async () => {
    const { ids } = await vaultOf(26)
    const { result, release } = await heldRun(ids)
    expect(useBulkRefreshStore().run).toMatchObject({ total: 26, done: 0 })
    useBulkRefreshStore().stop()
    release()
    expect(await result).toMatchObject({ updated: 25, left: [ids[25]] })
})

it('ends on a Steam failure with what is left, and on a vault lock with nothing', async () => {
    const { session, ids } = await vaultOf(1)
    down = true
    const failed = await useBulkRefreshStore().start(ids, false)
    expect(failed?.error).toBeInstanceOf(SteamError)
    expect(failed?.left).toEqual(ids)

    down = false
    const { result, release } = await heldRun(ids)
    session.lock()
    release()
    expect(await result).toBeNull()
})
