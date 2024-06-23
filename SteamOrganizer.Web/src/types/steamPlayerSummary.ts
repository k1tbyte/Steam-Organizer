export const enum EVisibilityState {
    Private = 1,
    FriendsOnly = 2,
    Public = 3
}

export const enum ECommentPermission {
    FriendsOnly = 0,
    Public = 1,
    Private = 2,
}

export const enum EEconomyBanType {
    None = 0,
    Probation = 1,
    Banned = 2
}

export type SteamPlayerBans = {
    communityBanned: boolean;
    numberOfVacBans: number;
    numberOfGameBans: number;
    daysSinceLastBan: number;
    economyBan: EEconomyBanType;
}

export type SteamGameInfo = {
    appId: number;
    playtime_forever: number;
    name: number;
    formattedPrice?: string;
}

export type SteamPlayerGames = {
    games?: SteamGameInfo[],
    gamesCount: number;
    playedGamesCount: number;
    hoursOnPlayed: number;
    gamesBoundaryBadge: number;
    gamesPriceFormatted?: string;
    gamesPrice: number;
    paidGames?: number;
}

export type SteamPlayerSummary = {
    steamId: number;
    avatarHash?: string;
    personaName?: string;
    profileUrl?: string;
    locCountryCode?: string;
    timeCreated?: Date;
    communityVisibilityState: EVisibilityState;
    commentPermission: ECommentPermission;
    steamLevel?: number;
    bans?: SteamPlayerBans;
    gamesSummaries?: SteamPlayerGames
}