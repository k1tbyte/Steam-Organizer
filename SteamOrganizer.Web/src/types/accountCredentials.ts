import { Icon } from "@/assets";

export const serviceNames = {
    [Icon.UPlay]: "UPlay",
    [Icon.EpicGames]: "Epic Games",
    [Icon.ElectronicArts]: "Electronic Arts",
    [Icon.RockstarGames]: "Rockstar Games",
    [Icon.Xbox]: "Xbox",
    [Icon.BattleNet]: "Battle.net",
    [Icon.Wargaming]: "Wargaming",
    [Icon.Email]: "Steam email",
    [Icon.Square]: "ZeniMax"
}

export const enum ECredentialType {
    Login,
    Email,
    Password,
    SecretWord,
    Phone
}

export interface IAccountCredential {
    // Icon of the credential
    i?: Icon,
    // Name of the credential
    n?: string,
    f: Record<number, string>
}