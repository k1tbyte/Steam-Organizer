import FingerprintJS from "@fingerprintjs/fingerprintjs";
import db from "../services/indexedDb.ts"
import {decrypt, deriveKey, encrypt } from "../services/cryptography.ts";
import {debounce} from "@/lib/utils.ts";

interface IAppConfig {
    encryptionKey?: string
    steamApiKey?: string
    autoSync?: boolean
}

export const enum EDecryptResult {
    Success,
    NoKey,
    NeedAuth,
    BadCredentials
}

let fingerprint: CryptoKey | undefined;

export const defaultAvatar = "fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb"

export let config: IAppConfig;

export const  loadConfig = async () => {
    const agent = await FingerprintJS.load();
    let { visitorId } = await agent.get();

    if(import.meta.env.VITE_SKIP_FINGERPRINT) {
        visitorId = "test"
    }
    fingerprint = await deriveKey({ secret: visitorId, iterations: 1})
    const configBytes = await db.get<ArrayBuffer>("config")

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

export const delayedSaveConfig = debounce(saveConfig, 3000)