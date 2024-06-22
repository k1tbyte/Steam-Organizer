import {EVisibilityState, SteamPlayerSummary} from "@/types/steamPlayerSummary.ts";

export class Account {
    nickname: string;
    login: string;
    password: string;
    phone?: number;
    note?: string;

    id?: number;
    visibilityState?: EVisibilityState;
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


    public isAnonymous() {
        return this.id === undefined;
    }

    public isBanned(): boolean {
        // @ts-ignore
        return this.haveCommunityBan || this.vacBansCount || this.gameBansCount || this.daysSinceLastBan || this.economyBan;
    }

    public assign(info: SteamPlayerSummary) {
        if(this.avatarHash) {
            this.lastUpdateDate = new Date()
        }

        this.nickname = info.personaName
        this.avatarHash = info.avatarHash
        this.visibilityState = info.communityVisibilityState
        this.steamLevel = info.steamLevel
        this.vanityUrl = info.profileUrl
    }

    constructor(login: string, password: string, accountId?: number) {
        this.addedDate = new Date()
        this.nickname = this.login = login
        this.password = password
        this.id = accountId
    }
}