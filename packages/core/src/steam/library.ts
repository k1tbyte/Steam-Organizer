import type { SteamSnapshot, SteamStats } from '../account/records'
import { type SteamApi, SteamError } from './api'
import type { Collection } from './collection'
import type { SteamCurrency } from './currencies'
import { eachLimited } from './profiles'
import { libraryPrices } from './store'

interface Owned {
    appid: number
    name?: string
    img_icon_url?: string
    playtime_forever: number
    playtime_2weeks?: number
}

async function fetchGames(api: SteamApi, steamid: string) {
    const { response } = await api.get<{
        response: { game_count?: number; games?: Owned[] }
    }>('IPlayerService/GetOwnedGames/v1/', {
        steamid,
        include_appinfo: 'true',
        include_played_free_games: 'true',
    })
    // A hidden library answers an empty response; an empty one, a zero count and no list.
    if (response.game_count === undefined) return null
    return (response.games ?? []).map((game) => ({
        appId: game.appid,
        name: game.name ?? '',
        icon: game.img_icon_url ?? '',
        minutes: game.playtime_forever,
        recentMinutes: game.playtime_2weeks ?? 0,
    }))
}

async function fetchFriends(api: SteamApi, steamid: string) {
    try {
        const { friendslist } = await api.get<{
            friendslist?: {
                friends?: { steamid: string; friend_since: number }[]
            }
        }>('ISteamUser/GetFriendList/v1/', { steamid, relationship: 'friend' })
        return (friendslist?.friends ?? []).map((friend) => ({
            steamId: friend.steamid,
            since: friend.friend_since ? friend.friend_since * 1000 : null,
        }))
    } catch (error) {
        // A private list answers 401; the key just read the profile, so it is not the key.
        if (error instanceof SteamError && error.kind === 'bad-key') return null
        throw error
    }
}

/** The games and friends of these public profiles. */
export async function fetchCollections(
    api: SteamApi,
    steamIds: readonly string[],
): Promise<Map<string, Collection>> {
    const found = new Map<string, Collection>()
    await eachLimited([...steamIds], async (steamId) => {
        const [games, friends] = await Promise.all([
            fetchGames(api, steamId),
            fetchFriends(api, steamId),
        ])
        found.set(steamId, { games, friends })
    })
    return found
}

/** `prices` in hundredths, null for a free or unsold game. */
export function libraryStats(
    { games, friends }: Collection,
    prices: ReadonlyMap<number, number | null>,
    currency: string,
): SteamStats | null {
    if (!games) return null
    let minutes = 0
    let played = 0
    let paid = 0
    let value = 0
    for (const game of games) {
        minutes += game.minutes
        if (game.minutes > 0) played++
        const price = prices.get(game.appId)
        if (price) {
            paid++
            value += price
        }
    }
    return {
        games: games.length,
        played,
        hours: Math.round(minutes / 60),
        paid,
        value: value / 100,
        currency,
        friends: friends?.length ?? null,
    }
}

/** The games and friends of the public ones among `profiles`, and each one's stats priced in `currency`. */
export async function withLibraries(
    api: SteamApi,
    fetch: typeof globalThis.fetch,
    profiles: ReadonlyMap<string, SteamSnapshot>,
    currency: SteamCurrency,
) {
    const open = [...profiles]
        .filter(([, profile]) => profile.visibility === 'public')
        .map(([steamId]) => steamId)
    const collections = await fetchCollections(api, open)
    const appIds = new Set(
        [...collections.values()].flatMap(
            ({ games }) => games?.map((game) => game.appId) ?? [],
        ),
    )
    const prices = await libraryPrices(fetch, [...appIds], currency)
    const priced = new Map(profiles)
    for (const [steamId, collection] of collections) {
        const profile = profiles.get(steamId)
        if (profile)
            priced.set(steamId, {
                ...profile,
                stats: libraryStats(collection, prices, currency),
            })
    }
    return { profiles: priced, collections }
}
