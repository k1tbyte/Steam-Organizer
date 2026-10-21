import { toSteamId64 } from '../../../core/steamId'

export const STEAM_LINK_KEYS = [
    'profile',
    'games',
    'friends',
    'inventory',
    'badges',
    'groups',
    'steamdb',
] as const
export type SteamLinkKey = (typeof STEAM_LINK_KEYS)[number]

/** The Steam community page, or the SteamDB calculator, of an account. */
export function steamLinkUrl(key: SteamLinkKey, accountId: string): string {
    const id = toSteamId64(accountId)
    const community = `https://steamcommunity.com/profiles/${id}`
    return {
        profile: community,
        games: `${community}/games/?tab=all`,
        friends: `${community}/friends/`,
        inventory: `${community}/inventory/`,
        badges: `${community}/badges/`,
        groups: `${community}/groups/`,
        steamdb: `https://steamdb.info/calculator/${id}/`,
    }[key]
}
