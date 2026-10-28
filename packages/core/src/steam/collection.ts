export interface OwnedGame {
    appId: number
    name: string
    /** The icon's hash on Steam's CDN. */
    icon: string
    minutes: number
    /** Played in the last two weeks. */
    recentMinutes: number
}

export interface SteamFriend {
    steamId: string
    /** Epoch ms; null for friendships older than Steam's record of them. */
    since: number | null
}

/** One account's games and friends; null where the profile hides them. */
export interface Collection {
    games: OwnedGame[] | null
    friends: SteamFriend[] | null
}
