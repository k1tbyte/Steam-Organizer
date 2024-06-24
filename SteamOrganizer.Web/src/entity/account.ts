import {EVisibilityState, SteamPlayerBans, SteamPlayerGames, SteamPlayerSummary} from "@/types/steamPlayerSummary.ts";
import {getPlayerInfo} from "@/services/steamApi.ts";

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

    _years?: number;

    public getYears() {
        if(!this.createdDate) {
            return
        }
        if(this._years) {
            return this._years
        }
        // @ts-ignore
        const diffInYears = (new Date() - new Date(this.createdDate)) / (1000 * 60 * 60 * 24 * 365.25);
        return (this._years = Math.floor(diffInYears * 10) / 10);
    }

    public isAnonymous() {
        return this.id === undefined;
    }

    public isBanned(): boolean {
        // @ts-ignore
        return this.haveCommunityBan || this.vacBansCount || this.gameBansCount || this.daysSinceLastBan || this.economyBan;
    }

    public assignBans(bans: SteamPlayerBans | undefined) {
        if(!bans) {
            return
        }

        this.economyBan = bans.economyBan;
        this.haveCommunityBan = bans.communityBanned;
        this.daysSinceLastBan = bans.daysSinceLastBan;
        this.gameBansCount = bans.numberOfGameBans;
        this.vacBansCount = bans.numberOfVacBans
    }
    public assignGames(games: SteamPlayerGames | undefined) {
        if(!games) {
            return;
        }

        this.gamesCount = games.gamesCount;
        this.gamesBadgeBoundary = games.gamesBoundaryBadge;
        this.totalGamesPrice = games.gamesPriceFormatted
        this.paidGames = games.paidGames
        this.playedGamesCount = games.playedGamesCount
        this.hoursOnPlayed = games.hoursOnPlayed
    }

    public assignInfo(info: SteamPlayerSummary) {
        if(this.avatarHash) {
            this.lastUpdateDate = new Date()
        }

        this.avatarHash = info.avatarHash
        this.nickname = info.personaName
        this.visibilityState = info.communityVisibilityState
        this.steamLevel = info.steamLevel
        this.vanityUrl = info.profileUrl
        this.createdDate = info.timeCreated ?? this.createdDate
        this.assignBans(info.bans)
        this.assignGames(info.gamesSummaries)
    }

    public static async new(login: string, password: string, accountId?: number) {
        const acc = new Account(login,password,accountId);
        if(!accountId) return acc;
        const info = await getPlayerInfo(acc.id)

        if(!info) {
            return undefined;
        }
        acc.assignInfo(info)
        return acc;
    }

    constructor(login: string, password: string, accountId?: number) {
        this.addedDate = new Date()
        this.nickname = this.login = login
        this.password = password
        this.id = accountId
    }
}