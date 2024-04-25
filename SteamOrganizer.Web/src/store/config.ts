import FingerprintJS from "@fingerprintjs/fingerprintjs";
import db from "../services/indexedDb.ts"
import {decrypt, deriveKey, encrypt, exportKey, importKey} from "../services/cryptography.ts";

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
    } catch { }
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

export const getAccounts = () => db.get("accounts") as Promise<ArrayBuffer | undefined>
export const storeEncryptionKey = async (key: CryptoKey) => {
    config.encryptionKey = await exportKey(key)
    databaseKey = key
    await saveConfig()
}

export const saveAccounts = async () => {
    await db.save(
        await encrypt(databaseKey!, JSON.stringify({ account1: "test" })),
        "accounts"
    )
}

export const loadAccounts = async () => {
    const dbBytes = await getAccounts()
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