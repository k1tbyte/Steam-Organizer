import FingerprintJS from "@fingerprintjs/fingerprintjs";
import db from "../services/indexedDb.ts"
import {decrypt, deriveKey, encrypt, importKey} from "../services/cryptography.ts";
interface IAppConfig {
    encryptionKey?: string
    test?: string
}

export const enum EDecryptResult {
    Success,
    NoKey,
    NeedAuth,
    BadCredentials
}

let fingerprint: CryptoKey | undefined;
let databaseKey: CryptoKey | undefined;

export let config: IAppConfig;
export let accounts: number[]

export const  loadConfig = async () => {
    const agent = await FingerprintJS.load();
    const { visitorId } = await agent.get();
    fingerprint = await deriveKey({ secret: "visitorId", iterations: 1})
    const configBytes = await db.get("config") as ArrayBuffer | undefined

    config = {}
    if(configBytes === undefined) {
        return
    }

    try {
        const data = await decrypt(fingerprint,configBytes);
        config = JSON.parse(data)
    } catch {  }
}

export const saveConfig = async () => {
    if(!fingerprint) {
        throw ("fingerprint is undefined")
    }

    await db.save(
        await encrypt(fingerprint, JSON.stringify(config)),
        "config"
    )
}

export const saveAccounts = async () => {

}

export const loadAccounts = async () => {
    const dbBytes = await db.get("accounts") as ArrayBuffer | undefined
    if(config.encryptionKey == undefined) {
        return dbBytes == undefined ? EDecryptResult.NoKey : EDecryptResult.NeedAuth
    }

    if(databaseKey == undefined) {
        databaseKey = await importKey(config.encryptionKey)
    }

    if(dbBytes == undefined) {
        accounts = []
        return EDecryptResult.Success
    }

    try {
        const data = await decrypt(databaseKey, dbBytes);
        accounts = JSON.parse(data)
        return EDecryptResult.Success
    } catch {
        return EDecryptResult.BadCredentials
    }
    //decrypt
}