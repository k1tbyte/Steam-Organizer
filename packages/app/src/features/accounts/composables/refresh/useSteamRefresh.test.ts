import 'fake-indexeddb/auto'

import { type AccountSecret, readAccount, steamApi } from '@so/core'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, expect, it, vi } from 'vitest'

import { useVaultSession } from '#features/vault'

import { useAccountLocks } from '../secrets/useAccountLocks'
import { useVaultAccounts } from '../useVaultAccounts'
import { useSteamRefresh } from './useSteamRefresh'

const KNOWN = '76561198000000001'
const GONE = '76561198000000002'

let name = 'Fresh'
let hold: Promise<void> | null = null
let arrived = () => {}

const fetch = (async (input: string | URL | Request) => {
    const persona = name
    const held = hold
    if (held) {
        arrived()
        await held
    }
    const url = new URL(String(input))
    const ids = (url.searchParams.get('steamids') ?? '').split(',')
    const known = ids.filter((id) => id === KNOWN)
    const reply: Record<string, unknown> = {
        '/ISteamUser/GetPlayerSummaries/v2/': {
            response: {
                players: known.map((steamid) => ({
                    steamid,
                    personaname: persona,
                    avatarhash: 'abc',
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
        api: async () => steamApi(fetch, 'KEY'),
    }),
}))

beforeEach(async () => {
    name = 'Fresh'
    hold = null
    await new Promise((resolve) => {
        indexedDB.deleteDatabase('steam-organizer').onsuccess = resolve
    })
    setActivePinia(createPinia())
})

async function vaultWith(...steamIds: string[]) {
    const session = useVaultSession()
    await session.create('Main', 'correct horse')
    const vault = useVaultAccounts()
    for (const [index, steamId] of steamIds.entries())
        await vault.add({
            login: `login${index}`,
            password: 'hunter22',
            steamId,
        })
    const ids = vault.accounts.value.map((account) => account.id)
    const data = (id: string) => readAccount(session.contents?.data.get(id))
    return { session, ids, data }
}

it('writes the profile without touching editedAt, and names the accounts Steam lost', async () => {
    const { ids, data } = await vaultWith(KNOWN, GONE)
    const [known, gone] = ids as [string, string]
    const edited = data(known)?.editedAt
    expect(await useSteamRefresh().refresh(ids)).toEqual([gone])
    expect(data(known)).toMatchObject({
        editedAt: edited,
        steam: { nickname: 'Fresh', avatar: 'abc' },
    })
    expect(data(gone)?.steam).toBeNull()
})

it('refreshes an everything-locked account only while it is open', async () => {
    const { session, ids, data } = await vaultWith(KNOWN)
    const [id] = ids as [string]
    const locks = useAccountLocks()
    await locks.setLock(id, '1234', 'everything', false)

    expect(await useSteamRefresh().refresh([id])).toEqual([])
    expect(session.contents?.data.get(id)).not.toHaveProperty('steam')
    expect(data(id)?.lock?.shown).toEqual({ nickname: 'Fresh', avatar: 'abc' })
    const secret = await session.secretOf<AccountSecret>(id)
    expect(secret?.hidden?.steam).toMatchObject({ nickname: 'Fresh' })

    locks.relock(id)
    const before = session.contents?.records.find((record) => record.id === id)
    expect(await useSteamRefresh().refresh([id])).toEqual([])
    expect(session.contents?.records.find((record) => record.id === id)).toBe(
        before,
    )
})

it('keeps a newer snapshot over the reply to an older refresh', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    const { ids, data } = await vaultWith(KNOWN)
    const { refresh } = useSteamRefresh()
    let release = () => {}
    hold = new Promise((resolve) => {
        release = resolve
    })
    const inFlight = new Promise<void>((resolve) => {
        arrived = resolve
    })
    name = 'Older'
    const older = refresh(ids)
    await inFlight
    hold = null
    vi.setSystemTime(Date.now() + 1000)
    name = 'Newer'
    await refresh(ids)
    release()
    await older
    expect(data(ids[0] as string)?.steam?.nickname).toBe('Newer')
    vi.useRealTimers()
})
