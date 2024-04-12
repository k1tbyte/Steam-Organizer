import FingerprintJS from "@fingerprintjs/fingerprintjs";
import db from "../services/indexedDb.ts"
import {decrypt, deriveKey, encrypt} from "../services/cryptography.ts";
interface IAppConfig {
    databaseKey?: ArrayBuffer
    test?: string
}

export const enum EDecryptResult {
    Success,
    NoKey,
    NeedAuth
}

let fingerprint: CryptoKey | undefined;
export let config: IAppConfig;

export const  loadConfig = async () => {
    const agent = await FingerprintJS.load();
    const { visitorId } = await agent.get();
    fingerprint = await deriveKey("visitorId",1)
    console.log(visitorId)
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
    if(config.databaseKey == undefined) {
        return EDecryptResult.NoKey
    }

    //decrypt
}