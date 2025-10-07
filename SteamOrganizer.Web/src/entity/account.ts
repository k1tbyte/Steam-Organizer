import {
    EEconomyBanType,
    type EVisibilityState,
    type SteamPlayerBans,
    type SteamPlayerGames,
    type SteamPlayerSummary
} from "@/types/steamPlayerSummary";
import {getPlayerInfo, getSteamTime} from "@/shared/api/steamApi";
import type {IAccountCredential} from "@/types/accountCredentials.ts";
import {accounts} from "@/store/accounts";
import {ISteamAuth} from "@/entity/steamAuth";
import {ETimeUnit, formatTimeDifference, TimeFormat} from "@/shared/lib/timeFormatting";

const codeInterval = 30;
const steamCodeCharacters = "23456789BCDFGHJKMNPQRTVWXY";

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

    authenticator?: ISteamAuth;

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

    private _getBanSinceInfo() {
        const total = this.gameBansCount + this.vacBansCount;
        return this.daysSinceLastBan ?
            (total > 1 ? "\nLast ban received " : "\nBan received ") +
                `${formatTimeDifference(this.daysSinceLastBan, ETimeUnit.Days, TimeFormat.Years | TimeFormat.Days)} ago` :
            null
    }

    public getVacBanInfo() {
        return this.vacBansCount ?
            `This account has been banned by VAC${(this.vacBansCount > 1 ? ` in several games (${this.vacBansCount})` : "")}.${this._getBanSinceInfo()}` :
            null
    }

    public getGameBanInfo() {
        return this.gameBansCount ?
            `This account has a game ban${(this.gameBansCount > 1 ? ` in several games (${this.gameBansCount})` : "")}.${this._getBanSinceInfo()}` :
            null
    }

    public getCommunityBanInfo() {
        return this.haveCommunityBan ? "The account is not allowed to interact with the Steam community" : null;
    }

    public getTradeBanInfo() {
        return `${(this.economyBan === EEconomyBanType.Probation ?
                "The account is temporarily blocked." : "The account is permanently blocked."
        )} Trade/exchange/sending of gifts is prohibited on this account`
    }

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

    public async generate2faCode (): Promise<string | null> {
        const time = await getSteamTime();
        const sharedSecret = this.authenticator?.shared_secret;
        if (!sharedSecret || !time) {
            return null;
        }

        const sharedSecretArray = Uint8Array.from(atob(sharedSecret), c => c.charCodeAt(0));
        const timeBuffer = new ArrayBuffer(8);
        const timeArray = new DataView(timeBuffer);
        timeArray.setUint32(4, Math.floor(time / codeInterval), false);

        const key = await crypto.subtle.importKey(
            "raw",
            sharedSecretArray,
            { name: "HMAC", hash: "SHA-1" },
            false,
            ["sign"]
        );

        const hashedData = new Uint8Array(await crypto.subtle.sign("HMAC", key, timeBuffer));
        const codeArray = new Array(5);
        const b = hashedData[19] & 0xF;
        let codePoint = ((hashedData[b] & 0x7F) << 24) |
            ((hashedData[b + 1] & 0xFF) << 16) |
            ((hashedData[b + 2] & 0xFF) << 8) |
            (hashedData[b + 3] & 0xFF);

        for (let i = 0; i < 5; ++i) {
            codeArray[i] = steamCodeCharacters[codePoint % steamCodeCharacters.length];
            codePoint = Math.floor(codePoint / steamCodeCharacters.length);
        }

        return codeArray.join('');
    }

    constructor(login: string, password: string, accountId?: number) {
        this.addedDate = new Date()
        this.nickname = this.login = login
        this.password = password
        this.id = accountId
    }
}