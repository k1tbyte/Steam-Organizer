import FingerprintJS from "@fingerprintjs/fingerprintjs";
import db from "../services/indexedDb.ts"
import {decrypt, deriveKey, encrypt } from "../services/cryptography.ts";

interface IAppConfig {
    encryptionKey?: string
    steamApiKey?: string
}

export const enum EDecryptResult {
    Success,
    NoKey,
    NeedAuth,
    BadCredentials
}

let fingerprint: CryptoKey | undefined;

export let config: IAppConfig;

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