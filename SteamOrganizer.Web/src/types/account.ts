import { SteamAuth } from "./steamAuth.ts";

export class Account {
    nickname: string;
    login: string;
    password: string;
    phone?: number;
    note?: string;

    id?: number;
    visibilityState?: number;
    vanityUrl?: string;
    steamLevel?: number;
    createdDate?: Date;
    addedDate: Date;
    lastUpdateDate?: Date;
    avatarHash?: string;

    haveCommunityBan?: boolean;
    vacBansCount?: number;
    gameBansCount?: number;
    daysSinceLastBan?: number;
    economyBan?: number;

    gamesCount?: number;
    playedGamesCount?: number;
    gamesBadgeBoundary?: number;
    hoursOnPlayed?: number;
    totalGamesPrice?: string;
    paidGames?: number;

    pinned?: boolean;
    unpinIndex?: number;

    authenticator?: SteamAuth


    isAnonymous() {
        return this.id === undefined;
    }

    isBanned(): boolean {
        // @ts-ignore
        return this.haveCommunityBan || this.vacBansCount || this.gameBansCount || this.daysSinceLastBan || this.economyBan;
    }

    constructor(login: string, password: string, accountId?: number) {
        this.addedDate = new Date()
        this.nickname = this.login = login
        this.password = password
        this.id = accountId
    }
}