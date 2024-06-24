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


/**
 * @returns
 * [0] - collided by id
 *
 * [1] - collided by login
 */
export const isAccountCollided = (id: number | undefined, login: string | undefined) => {
    if(!id && !login) {
        throw new Error("At least one identification field must be specified")
    }
    let byId: boolean
    let byLogin: boolean

    const contains = accounts.data.some(o =>
        (byId = (o.id && o.id === id)) || (byLogin =(login && o.login === login))
    )

    return contains ? [byId,byLogin] : undefined
}

/**
 * @param action The action after which saving is performed.
 * Return `false` from action if the action is unsuccessful. After this, no saving will be made.
 */
export const saveAccounts = async (action: () => boolean | void = undefined) => {

    if(action?.() === false) {
        return;
    }

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
        for(const acc of accounts.data) {
            Object.setPrototypeOf(acc, Account.prototype)
        }
        return EDecryptResult.Success
    } catch {
        return EDecryptResult.BadCredentials
    }
}