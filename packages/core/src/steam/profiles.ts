import type { SteamBans, SteamSnapshot } from '../account/records'
import type { SteamApi } from './api'
import { parseAccountId, toSteamId64, vanityIn } from './steamId'

// GetPlayerSummaries and GetPlayerBans take at most 100 ids.
const BATCH = 100
const REQUESTS_AT_ONCE = 4

interface Summary {
    steamid: string
    personaname: string
    avatarhash: string
    profileurl: string
    communityvisibilitystate: number
    timecreated?: number
}

interface Bans {
    SteamId: string
    CommunityBanned: boolean
    NumberOfVACBans: number
    NumberOfGameBans: number
    DaysSinceLastBan: number
    EconomyBan: string
}

// Steam's question mark for a profile without a picture: the initials look better.
const DEFAULT_AVATAR = 'fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb'

/** The picture behind a profile's `avatar` hash: `medium` is 64px, `full` 184px; null without one of its own. */
export function avatarUrl(hash: string, size: 'medium' | 'full') {
    if (hash === '' || hash === DEFAULT_AVATAR) return null
    return `https://avatars.steamstatic.com/${hash}_${size}.jpg`
}

const VISIBILITY: Record<number, SteamSnapshot['visibility']> = {
    2: 'friends',
    3: 'public',
}

function bansOf(bans: Bans | undefined): SteamBans {
    if (!bans)
        return {
            vac: 0,
            game: 0,
            community: false,
            economy: 'none',
            lastBanDays: null,
        }
    const { EconomyBan: economy } = bans
    const banned = bans.NumberOfVACBans + bans.NumberOfGameBans > 0
    return {
        vac: bans.NumberOfVACBans,
        game: bans.NumberOfGameBans,
        community: bans.CommunityBanned,
        economy:
            economy === 'probation' || economy === 'banned' ? economy : 'none',
        lastBanDays: banned ? bans.DaysSinceLastBan : null,
    }
}

// The game collector badge's tiers below 1000 games; above, one per thousand.
const BADGE_TIERS = [1, 5, 10, 25, 50, 100, 250, 500]
const COLLECTOR_BADGE = 13

function badgeOf(count: number) {
    const tier =
        count >= 1000
            ? Math.floor(count / 1000) * 1000
            : BADGE_TIERS.findLast((at) => count >= at)
    return tier ? `${tier}+` : ''
}

// The collector badge counts games its own way, not as the library list does, so it comes from Steam.
async function badgesOf(api: SteamApi, steamid: string) {
    const { response } = await api.get<{
        response: {
            player_level?: number
            badges?: { badgeid: number; level: number }[]
        }
    }>('IPlayerService/GetBadges/v1/', { steamid })
    const collector = response.badges?.find(
        (badge) => badge.badgeid === COLLECTOR_BADGE,
    )
    return {
        level: response.player_level ?? 0,
        badge: badgeOf(collector?.level ?? 0),
    }
}

export async function eachLimited<T>(
    items: T[],
    run: (item: T) => Promise<void>,
) {
    const queue = [...items]
    const worker = async () => {
        for (let item = queue.shift(); item; item = queue.shift())
            await run(item)
    }
    await Promise.all(Array.from({ length: REQUESTS_AT_ONCE }, worker))
}

async function fetchBatch(
    api: SteamApi,
    ids: string[],
    now: number,
    into: Map<string, SteamSnapshot>,
) {
    const steamids = ids.join(',')
    const [summaries, bans] = await Promise.all([
        api.get<{ response: { players: Summary[] } }>(
            'ISteamUser/GetPlayerSummaries/v2/',
            { steamids },
        ),
        api.get<{ players: Bans[] }>('ISteamUser/GetPlayerBans/v1/', {
            steamids,
        }),
    ])
    const bansById = new Map(
        bans.players.map((found) => [found.SteamId, found]),
    )
    const players = summaries.response.players
    // A private profile hides its badges: Steam answers them empty.
    const badges = new Map<string, { level: number; badge: string }>()
    await eachLimited(
        players.filter((player) => player.communityvisibilitystate === 3),
        async ({ steamid }) => {
            badges.set(steamid, await badgesOf(api, steamid))
        },
    )
    for (const player of players)
        into.set(player.steamid, {
            refreshedAt: now,
            nickname: player.personaname,
            avatar: player.avatarhash,
            level: badges.get(player.steamid)?.level ?? 0,
            badge: badges.get(player.steamid)?.badge ?? '',
            registeredAt: player.timecreated ? player.timecreated * 1000 : null,
            visibility:
                VISIBILITY[player.communityvisibilitystate] ?? 'private',
            vanity: vanityIn(player.profileurl),
            bans: bansOf(bansById.get(player.steamid)),
            stats: null,
        })
}

/** Resolves once Steam accepts the key. */
export async function checkKey(api: SteamApi) {
    await api.get('ISteamUser/GetPlayerSummaries/v2/', {
        steamids: '76561197960287930',
    })
}

/** The profiles of these SteamID64s; an id Steam has no profile for is absent. */
export async function fetchProfiles(
    api: SteamApi,
    ids: readonly string[],
    now = Date.now(),
): Promise<Map<string, SteamSnapshot>> {
    const found = new Map<string, SteamSnapshot>()
    for (let start = 0; start < ids.length; start += BATCH)
        await fetchBatch(api, ids.slice(start, start + BATCH), now, found)
    return found
}

/** The SteamID64 in what the user typed; Steam resolves a vanity name or a custom URL. null: nothing to resolve or no match. */
export async function resolveSteamId(
    api: SteamApi,
    raw: string,
): Promise<string | null> {
    const accountId = parseAccountId(raw)
    if (accountId !== null) return toSteamId64(accountId)
    const vanity = vanityIn(raw)
    if (vanity === null) return null
    const { response } = await api.get<{
        response: { success: number; steamid?: string }
    }>('ISteamUser/ResolveVanityURL/v1/', { vanityurl: vanity })
    return response.success === 1 ? (response.steamid ?? null) : null
}
