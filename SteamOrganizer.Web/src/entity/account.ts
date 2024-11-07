import { type EVisibilityState, type SteamPlayerBans, type SteamPlayerGames, type SteamPlayerSummary} from "@/types/steamPlayerSummary.ts";
import {getPlayerInfo} from "@/services/steamApi.ts";
import type {IAccountCredential} from "@/types/accountCredentials.ts";
import {accounts} from "@/store/accounts.ts";

export class Account {
    nickname: string;
    login: string;
    password: string;
    phone?: number;
    note?: string;
    credentials?: IAccountCredential[];

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
        const diffInYears = (new Date() - this.createdDate) / (1000 * 60 * 60 * 24 * 365.25);
        return (this._years = Math.floor(diffInYears * 10) / 10);
    }

    public isAnonymous() {
        return this.id === undefined;
    }

    public isBanned(): boolean {
        // @ts-ignore
        return this.haveCommunityBan || this.vacBansCount || this.gameBansCount || this.daysSinceLastBan || this.economyBan;
    }

    public isUpToDate() {
        if(!this.id) {
            return true;
        }

        const now = new Date().getTime()
        const last = this.lastUpdateDate?.getTime() ?? this.addedDate.getTime()
        return now - last < 1000 * 60 * 60;
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
        Account.initAccount(this);
    }

    public async update() {
        if(this.id) {
            const info = await getPlayerInfo(this.id);

            if(!info) {
                return undefined;
            }
            this.assignInfo(info)
        }

        return this;
    }

    public static initAccount(acc: Account) {
        Object.setPrototypeOf(acc, Account.prototype);
        acc.createdDate = acc.createdDate ? new Date(acc.createdDate) : undefined;
        acc.lastUpdateDate = acc.lastUpdateDate ? new Date(acc.lastUpdateDate) : undefined;
        acc.addedDate = new Date(acc.addedDate);
    }

    public moveTo(selfIndex: number, newIndex: number) {
        if(newIndex === selfIndex) {
            return
        }
        accounts.value.splice(newIndex, 0, accounts.value.splice(selfIndex, 1)[0]);
    }

    constructor(login: string, password: string, accountId?: number) {
        this.addedDate = new Date()
        this.nickname = this.login = login
        this.password = password
        this.id = accountId
    }
}