import { describe, expect, it } from 'vitest'

import { SteamError, steamApi } from './api'
import { avatarUrl, fetchProfiles, resolveSteamId } from './profiles'

const PUBLIC = '76561199044795099'
const PRIVATE = '76561197960287930'

type Reply = unknown | ((params: URLSearchParams) => unknown)

/** Answers each Web API path with JSON, a status code or a network failure. */
function fakeFetch(replies: Record<string, Reply>, calls: string[] = []) {
    return (async (input: string | URL | Request) => {
        const url = new URL(String(input))
        calls.push(url.pathname)
        const reply = replies[url.pathname]
        if (reply === 'offline') throw new TypeError('Failed to fetch')
        if (typeof reply === 'number')
            return new Response('', { status: reply })
        const body =
            typeof reply === 'function' ? reply(url.searchParams) : reply
        return new Response(JSON.stringify(body))
    }) as typeof fetch
}

const summary = (steamid: string, visibility: number) => ({
    steamid,
    personaname: `name ${steamid.slice(-3)}`,
    avatarhash: 'fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb',
    profileurl:
        visibility === 3
            ? 'https://steamcommunity.com/id/kyzzdef/'
            : `https://steamcommunity.com/profiles/${steamid}/`,
    communityvisibilitystate: visibility,
    ...(visibility === 3 && { timecreated: 1_500_000_000 }),
})

const bans = (SteamId: string, vac: number) => ({
    SteamId,
    CommunityBanned: false,
    NumberOfVACBans: vac,
    NumberOfGameBans: 0,
    DaysSinceLastBan: vac > 0 ? 120 : 0,
    EconomyBan: 'none',
})

const profiles = {
    '/ISteamUser/GetPlayerSummaries/v2/': (params: URLSearchParams) => ({
        response: {
            players: (params.get('steamids') ?? '')
                .split(',')
                .filter((id) => id !== '76561197960265729')
                .map((id) => summary(id, id === PUBLIC ? 3 : 1)),
        },
    }),
    '/ISteamUser/GetPlayerBans/v1/': (params: URLSearchParams) => ({
        players: (params.get('steamids') ?? '')
            .split(',')
            .map((id) => bans(id, id === PRIVATE ? 1 : 0)),
    }),
    '/IPlayerService/GetSteamLevel/v1/': { response: { player_level: 21 } },
}

describe('fetchProfiles', () => {
    it('reads summaries, bans and the level of a public profile', async () => {
        const calls: string[] = []
        const api = steamApi(fakeFetch(profiles, calls), 'KEY')
        const found = await fetchProfiles(api, [PUBLIC, PRIVATE], 1000)
        expect(found.get(PUBLIC)).toEqual({
            refreshedAt: 1000,
            nickname: 'name 099',
            avatar: 'fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb',
            level: 21,
            registeredAt: 1_500_000_000_000,
            visibility: 'public',
            vanity: 'kyzzdef',
            bans: {
                vac: 0,
                game: 0,
                community: false,
                economy: 'none',
                lastBanDays: null,
            },
            stats: null,
        })
        expect(found.get(PRIVATE)).toMatchObject({
            level: 0,
            registeredAt: null,
            visibility: 'private',
            vanity: null,
            bans: { vac: 1, lastBanDays: 120 },
        })
        // The private profile's level is never asked for.
        expect(
            calls.filter((path) => path.includes('GetSteamLevel')),
        ).toHaveLength(1)
    })

    it('leaves out an id Steam has no profile for, and batches by 100', async () => {
        const calls: string[] = []
        const api = steamApi(fakeFetch(profiles, calls), 'KEY')
        const ids = Array.from({ length: 150 }, (_, i) =>
            (76561197960265729n + BigInt(i)).toString(),
        )
        const found = await fetchProfiles(api, ids)
        expect(found.size).toBe(149)
        expect(found.has('76561197960265729')).toBe(false)
        expect(
            calls.filter((path) => path.includes('GetPlayerSummaries')),
        ).toHaveLength(2)
    })

    it.each([
        ['offline', 'offline'],
        [403, 'bad-key'],
        [429, 'rate-limit'],
        [500, 'server'],
    ] as const)('tells a %s failure as %s', async (reply, kind) => {
        const api = steamApi(
            fakeFetch({
                ...profiles,
                '/ISteamUser/GetPlayerSummaries/v2/': reply,
            }),
            'KEY',
        )
        await expect(fetchProfiles(api, [PUBLIC])).rejects.toEqual(
            new SteamError(kind),
        )
    })
})

it('fails without a key before asking Steam', async () => {
    const calls: string[] = []
    const api = steamApi(fakeFetch(profiles, calls), '')
    await expect(fetchProfiles(api, [PUBLIC])).rejects.toEqual(
        new SteamError('no-key'),
    )
    expect(calls).toEqual([])
})

describe('resolveSteamId', () => {
    const vanity = {
        '/ISteamUser/ResolveVanityURL/v1/': (params: URLSearchParams) =>
            params.get('vanityurl') === 'kyzzdef'
                ? { response: { success: 1, steamid: PUBLIC } }
                : { response: { success: 42, message: 'No match' } },
    }

    it('reads a typed ID without Steam', async () => {
        const calls: string[] = []
        const api = steamApi(fakeFetch(vanity, calls), 'KEY')
        expect(await resolveSteamId(api, '[U:1:1084529371]')).toBe(PUBLIC)
        expect(calls).toEqual([])
    })

    it('asks Steam for a name shaped like a friend code whose check bits fail', async () => {
        const calls: string[] = []
        const api = steamApi(fakeFetch(vanity, calls), 'KEY')
        expect(await resolveSteamId(api, 'kyzz-defs')).toBeNull()
        expect(calls).toEqual(['/ISteamUser/ResolveVanityURL/v1/'])
    })

    it('asks Steam for a vanity name or a custom URL', async () => {
        const api = steamApi(fakeFetch(vanity), 'KEY')
        expect(await resolveSteamId(api, 'steamcommunity.com/id/kyzzdef')).toBe(
            PUBLIC,
        )
        expect(await resolveSteamId(api, 'nobody_here')).toBeNull()
    })
})

it("builds an avatar URL, none for Steam's default picture", () => {
    expect(avatarUrl('c5d56249ee5d28a07db4ac9f7f60af961fab5426', 'full')).toBe(
        'https://avatars.steamstatic.com/c5d56249ee5d28a07db4ac9f7f60af961fab5426_full.jpg',
    )
    expect(
        avatarUrl('fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb', 'medium'),
    ).toBeNull()
    expect(avatarUrl('', 'medium')).toBeNull()
})
