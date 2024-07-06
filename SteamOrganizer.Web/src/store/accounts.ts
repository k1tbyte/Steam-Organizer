import {Account} from "@/entity/account.ts";
import db from "@/services/indexedDb.ts";
import {decrypt, encrypt, exportKey, importKey} from "@/services/cryptography.ts";
import {config, EDecryptResult, saveConfig} from "@/store/config.ts";
import {ObservableObject} from "@/lib/observableObject.ts";
import {isAuthorized} from "@/services/gAuth.ts";
import {storeBackup} from "@/store/backups.ts";
import {jsonDateReviver, jsonIgnoreNull} from "@/lib/utils.ts";
import {toast, ToastVariant} from "@/components/primitives/Toast.tsx";
import { openAuthPopup} from "@/pages/Modals/Authentication.tsx";

export const accounts = new ObservableObject<Account[]>(undefined)
export let timestamp: Date | undefined;
export let databaseKey: CryptoKey | undefined;

const dbFieldName = "accounts"

export const getAccountsBuffer = () => db.get(dbFieldName) as Promise<ArrayBuffer | undefined>

export const exportAccounts = async (timestamp: Date | undefined = undefined) => {
    const data = timestamp ? { timestamp: timestamp, data: accounts.data } : accounts.data;
    return encrypt(databaseKey!, JSON.stringify(data, jsonIgnoreNull));
}

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
export const saveAccounts = async (action: () => boolean | void = null, sync: boolean = true) => {

    if(action?.() === false) {
        return;
    }

    await db.save(
        await exportAccounts(timestamp = new Date()),
        dbFieldName
    )

    if(isAuthorized && sync) {
        await storeBackup(timestamp)
    }
}

export const initAccounts = () => accounts.set([])

export const importAccounts = async (json: string, save: boolean = false) => {
    const object = JSON.parse(json, jsonDateReviver)
    timestamp = object.timestamp ?? new Date()
    const col = object.data ?? object
    for (const acc of col) {
        Object.setPrototypeOf(acc, Account.prototype)
    }
    accounts.set(col)

    if(save) {
        await saveAccounts(null, false)
    }
}

export const clearAccounts = async () => {
    return db.remove(dbFieldName)
}

export const loadAccounts = async (bytes: ArrayBuffer | null = null) => {
    let result: EDecryptResult = EDecryptResult.Success;
    try {
        bytes = bytes ?? await getAccountsBuffer()
        if (config.encryptionKey == undefined) {
            result = bytes == undefined ? EDecryptResult.NoKey : EDecryptResult.NeedAuth
            return
        }

        if (databaseKey == undefined) {
            databaseKey = await importKey(config.encryptionKey)
        }

        if (bytes == undefined) {
            initAccounts()
            return
        }
        try {
            await importAccounts(await decrypt(databaseKey, bytes))
        }
        catch {
            initAccounts()
            result = EDecryptResult.BadCredentials
        }
    } catch {
        toast.open({
            body: "An unknown critical error occurred while loading accounts",
            variant: ToastVariant.Error
        })
    } finally {
        if(result) {
            openAuthPopup({ reason: result, buffer: bytes })
        }
    }
}