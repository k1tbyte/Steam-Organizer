import 'fake-indexeddb/auto'

import { expect, it } from 'vitest'

import { steamCache } from '../storage/steamCache'
import { createVault } from '../vault/vault'
import { steamApi } from './api'
import { fetchCollections, libraryStats } from './library'
import { libraryPrices } from './store'

const OPEN = '76561199044795099'
const HIDDEN = '76561197960287930'
const EMPTY = '76561197960265731'

const owned = [
    {
        appid: 10,
        name: 'Counter-Strike',
        playtime_forever: 600,
        img_icon_url: 'a',
    },
    {
        appid: 440,
        name: 'Team Fortress 2',
        playtime_forever: 90,
        playtime_2weeks: 30,
    },
    { appid: 620, name: 'Portal 2', playtime_forever: 0 },
]

/** The Web API and the store; `calls` counts each path. */
function fakeFetch(calls: string[] = []) {
    return (async (input: string | URL | Request) => {
        const url = new URL(String(input))
        calls.push(url.pathname)
        const steamid = url.searchParams.get('steamid')
        switch (url.pathname) {
            case '/IPlayerService/GetOwnedGames/v1/':
                return Response.json({
                    response:
                        steamid === OPEN
                            ? { game_count: 3, games: owned }
                            : steamid === EMPTY
                              ? { game_count: 0 }
                              : {},
                })
            case '/ISteamUser/GetFriendList/v1/':
                if (steamid === EMPTY) return Response.json({ friendslist: {} })
                return steamid === OPEN
                    ? Response.json({
                          friendslist: {
                              friends: [
                                  { steamid: '1', friend_since: 1_600_000_000 },
                                  { steamid: '2', friend_since: 0 },
                              ],
                          },
                      })
                    : new Response('{}', { status: 401 })
            case '/ISteamUser/GetPlayerSummaries/v2/':
                return Response.json({
                    response: {
                        players: (url.searchParams.get('steamids') ?? '')
                            .split(',')
                            .filter((id) => id === '1')
                            .map((id) => ({
                                steamid: id,
                                personaname: 'One',
                                avatarhash: 'h1',
                            })),
                    },
                })
            case '/api/appdetails':
                return Response.json(
                    Object.fromEntries(
                        (url.searchParams.get('appids') ?? '')
                            .split(',')
                            .map((id) => [
                                id,
                                id === '440'
                                    ? { success: true, data: [] }
                                    : {
                                          success: true,
                                          data: {
                                              price_overview: {
                                                  initial:
                                                      id === '10' ? 999 : 1999,
                                              },
                                          },
                                      },
                            ]),
                    ),
                )
        }
        return new Response('', { status: 404 })
    }) as typeof fetch
}

it('reads a library and friends, an empty one as empty, and a hidden one as null rather than a bad key', async () => {
    const collections = await fetchCollections(steamApi(fakeFetch(), 'KEY'), [
        OPEN,
        HIDDEN,
        EMPTY,
    ])
    expect(collections.get(OPEN)).toMatchObject({
        games: [
            {
                appId: 10,
                name: 'Counter-Strike',
                icon: 'a',
                minutes: 600,
                recentMinutes: 0,
            },
            { appId: 440, recentMinutes: 30 },
            { appId: 620 },
        ],
        friends: [
            {
                steamId: '1',
                since: 1_600_000_000_000,
                nickname: 'One',
                avatar: 'h1',
            },
            { steamId: '2', since: null, nickname: '', avatar: '' },
        ],
    })
    expect(collections.get(HIDDEN)).toEqual({ games: null, friends: null })
    expect(collections.get(EMPTY)).toEqual({ games: [], friends: [] })
})

it('sums the library at store prices, free games apart', async () => {
    const collections = await fetchCollections(steamApi(fakeFetch(), 'KEY'), [
        OPEN,
    ])
    const collection = collections.get(OPEN)
    if (!collection) throw new Error('no collection')
    const prices = new Map([
        [10, 999],
        [440, null],
        [620, 1999],
    ])
    expect(libraryStats(collection, prices, 'USD')).toEqual({
        games: 3,
        played: 2,
        hours: 12,
        paid: 2,
        value: 29.98,
        currency: 'USD',
        friends: 2,
    })
    expect(libraryStats({ games: null, friends: [] }, prices, 'USD')).toBeNull()
})

it('fetches only the prices it has no fresh copy of', async () => {
    const calls: string[] = []
    const fetch = fakeFetch(calls)
    expect(await libraryPrices(fetch, [10, 440], 'EUR', 1000)).toEqual(
        new Map([
            [10, 999],
            [440, null],
        ]),
    )
    await libraryPrices(fetch, [10, 440, 620], 'EUR', 2000)
    expect(calls).toEqual(['/api/appdetails', '/api/appdetails'])
    expect((await libraryPrices(fetch, [620], 'EUR', 3000)).get(620)).toBe(1999)
    expect(calls).toHaveLength(2)
})

it('keeps a collection only for the vault that sealed it, and only while asked to', async () => {
    const changed: string[] = []
    const stop = steamCache.onCollection((id) => changed.push(id))
    const { key } = await createVault('first')
    const { key: other } = await createVault('second')
    const entry = { games: [], friends: null, fetchedAt: 1 }
    await steamCache.putCollection(key, 'a2', entry, () => false)
    expect(await steamCache.collection(key, 'a2')).toBeNull()
    await steamCache.putCollection(key, 'a1', entry, () => true)
    expect(await steamCache.collection(key, 'a1')).toEqual(entry)
    expect(await steamCache.collection(other, 'a1')).toBeNull()
    await steamCache.forgetCollection('a1')
    expect(await steamCache.collection(key, 'a1')).toBeNull()
    stop()
    await steamCache.forgetCollection('a1')
    expect(changed).toEqual(['a2', 'a1', 'a1'])
})
