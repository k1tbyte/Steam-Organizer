import {Account} from "@/entity/account.ts";
import db from "@/services/indexedDb.ts";
import {decrypt, encrypt, exportKey, importKey} from "@/services/cryptography.ts";
import {config, EDecryptResult, saveConfig} from "@/store/config.ts";
import {ObservableObject} from "@/lib/observableObject.ts";
import {isAuthorized} from "@/services/gAuth.ts";
import {storeBackup} from "@/store/backups.ts";
import {jsonIgnoreNull} from "@/lib/utils.ts";

export const accounts = new ObservableObject<Account[]>([])
export let databaseKey: CryptoKey | undefined;

const dbFieldName = "accounts"

export const getAccountsBuffer = () => db.get(dbFieldName) as Promise<ArrayBuffer | undefined>

export const exportAccounts = async () => encrypt(databaseKey!, JSON.stringify(accounts.data, jsonIgnoreNull))

export const storeEncryptionKey = async (key: CryptoKey) => {
    config.encryptionKey = await exportKey(key)
    databaseKey = key
    await saveConfig()
}

export const saveAccounts = async () => {
    await db.save(
        await exportAccounts(),
        dbFieldName
    )

    if(isAuthorized) {
        await storeBackup()
    }
}

export const loadAccounts = async (bytes: ArrayBuffer | null = null) => {
    bytes = bytes ?? await getAccountsBuffer()
    if(config.encryptionKey == undefined) {
        return bytes == undefined ? EDecryptResult.NoKey : EDecryptResult.NeedAuth
    }

    if(databaseKey == undefined) {
        databaseKey = await importKey(config.encryptionKey)
    }

    if(bytes == undefined) {
        return EDecryptResult.Success
    }

    try {   
        const data = await decrypt(databaseKey, bytes);
        accounts.set(JSON.parse(data))
        return EDecryptResult.Success
    } catch {
        return EDecryptResult.BadCredentials
    }
}