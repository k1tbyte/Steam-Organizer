import {Account} from "@/entity/account";
import db from "@/shared/services/indexedDb";
import {decrypt, encrypt, exportKey, importKey} from "@/shared/services/cryptography";
import {config, EDecryptResult, saveConfig} from "@/store/config";
import {ObservableObject} from "@/shared/lib/observer/observableObject";
import {isAuthorized} from "@/shared/services/gAuth";
import {storeBackup} from "@/store/backups";
import {debounce, jsonIgnoreNull} from "@/shared/lib/utils";
import {toast, ToastVariant} from "@/shared/ui/Toast";
import { openAuthPopup} from "@/pages/Modals/Authentication";
import {ESavingState, setSavingState} from "@/components/Header/SaveIndicator";
import {getPlayerInfoStream} from "@/shared/api/steamApi";
import {flagStore} from "@/store/local";

export const accounts = new ObservableObject<Account[]>(undefined)
export let dbTimestamp: Date | undefined;
export let databaseKey: CryptoKey | undefined;

let updateCancellation: AbortController | undefined;

const dbFieldName = "accounts"

export const getAccountsBuffer = () => db.get<ArrayBuffer>(dbFieldName)

/**
 * Exports the accounts data, optionally including a timestamp.
 *
 * @param {Date | undefined} [timestamp=undefined] - The timestamp to include in the exported data. If not provided, only the accounts data will be exported.
 * @returns {Promise<ArrayBuffer>} - A promise that resolves to the encrypted JSON string buffer of the exported accounts data.
 */
export const exportAccounts = async (timestamp: Date | undefined = undefined): Promise<ArrayBuffer> => {
    const data = timestamp ? { timestamp: timestamp, data: accounts.value } : accounts.value;
    return encrypt(databaseKey!, JSON.stringify(data, jsonIgnoreNull));
}

export const storeEncryptionKey = async (key: CryptoKey) => {
    config.encryptionKey = await exportKey(key)
    databaseKey = key
    await saveConfig()
}


/**
 * Checks if an account collides by id or login.
 *
 * @param {number | undefined} id - The account id to check.
 * @param {string | undefined} login - The account login to check.
 * @returns {[boolean, boolean] | undefined} - An array indicating collision by id and login, or undefined if no collision.
 * @throws {Error} - If neither id nor login is provided.
 */
export const isAccountCollided = (id?: number, login?: string): [boolean, boolean] | undefined => {
    if(!id && !login) {
        throw new Error("At least one identification field must be specified")
    }
    let byId: boolean
    let byLogin: boolean

    const contains = accounts.value.some(o =>
        (byId = (o.id && o.id === id)) || (byLogin =(login && o.login === login))
    )

    return contains ? [byId,byLogin] : undefined
}

/**
 * Saves accounts after performing the specified action.
 * Return `false` from the action if it is unsuccessful to prevent saving.
 *
 * @param {() => boolean | void} [action=null] - The action to perform before saving.
 * @param {boolean} [backup=true] - Whether to sync the backup if authorized.
 */
export const saveAccounts = async (action: () => boolean | void = null, backup: boolean = true) => {

    if(action?.() === false) {
        return;
    }

    try {
        await db.save(
            await exportAccounts(dbTimestamp = new Date()),
            dbFieldName
        )

        if(isAuthorized.value && backup && config.autoBackup) {
            setSavingState(ESavingState.Syncing)
            await storeBackup(dbTimestamp)
        }
        setSavingState(ESavingState.Saved)
    } catch(err) {
        setSavingState(ESavingState.Error)
        throw err;
    }
}

export const delayedSaveAccounts = debounce(saveAccounts, 3000)

export const saveDbMutation = (e?: (value: Account[]) => any) => {
    accounts.mutate(e)
    delayedSaveAccounts()
}

export const initAccounts = () => accounts.set([])

/**
 * Imports accounts from a JSON string and optionally saves them.
 *
 * @param {string} json - The JSON string containing the accounts data.
 * @param {boolean} [save=false] - Whether to save the accounts after importing.
 * @returns {Promise<void>}
 */
export const importAccounts = async (json: string, save: boolean = false): Promise<void> => {
    // Parse the JSON string with a date reviver
    const object = JSON.parse(json);

    // Set the timestamp to the parsed timestamp or the current date
    dbTimestamp = object.timestamp ? new Date(object.timestamp) : new Date();

    const col = (object.data ?? object) as Account[];
    for (const acc of col) {
        Account.initAccount(acc)
    }

    // Update the accounts observable object with the new data
    accounts.set(col);

    // Save the accounts if the save flag is true
    if (save) {
        await saveAccounts(null, false);
    }
};

export const clearAccounts = async () => {
    return db.remove(dbFieldName)
}

/**
 * Loads accounts from the provided bytes or from the database if bytes are not provided.
 *
 * @param {ArrayBuffer | null} [bytes=null] - The encrypted accounts data to be loaded. If null, data will be fetched from the database.
 * @returns {Promise<void>}
 */
export const loadAccounts = async (bytes: ArrayBuffer | null = null): Promise<void> => {
    let result: EDecryptResult = EDecryptResult.Success;
    try {
        // Fetch accounts buffer if bytes are not provided
        bytes = bytes ?? await getAccountsBuffer();

        // Check if encryption key is available
        if (!config.encryptionKey) {
            result = bytes ? EDecryptResult.NeedAuth : EDecryptResult.NoKey;
            return;
        }

        // Import the encryption key if not already imported
        databaseKey = databaseKey ?? await importKey(config.encryptionKey);

        // Initialize accounts if no bytes are provided
        if (!bytes) {
            initAccounts();
/*            for(let i =0 ; i < 100; i++) {
                accounts.value.push(new Account("account_" + i,"s", i))
            }*/
            return;
        }

        try {
            // Decrypt and import accounts
            await importAccounts(await decrypt(databaseKey, bytes));
        } catch {
            // Initialize accounts and set result to BadCredentials on decryption failure
            initAccounts();
            result = EDecryptResult.BadCredentials;
        }
    } catch (err) {
        // Show error toast on unknown critical error
        toast.open({
            body: "An unknown critical error occurred while loading accounts",
            variant: ToastVariant.Error
        });
        throw err;
    } finally {
        // Open authentication popup if result is not success (bad credentials or need auth)
        if (result) {
            openAuthPopup({ reason: result, buffer: bytes });
        }
    }
};

export const updateAccounts = async (cancel: boolean = false) => {
    if(cancel) {
        updateCancellation?.abort()
        return
    }

    const accs = new Map<number, Account>()
    const ids: number[] = [];
    for(const acc of accounts.value) {
        if(!acc.isUpToDate()) {
            accs.set(acc.id, acc)
            ids.push(acc.id)
        }
    }

    if(!ids.length) {
        toast.open({ body: "All accounts are up to date", variant: ToastVariant.Info, id: "accs-up-to-date" })
        return
    }

    const updateEmitter = flagStore.getEmitter(nameof(flagStore.store.isDbUpdating))
    updateEmitter(true)

    updateCancellation = new AbortController();
    let remaining = ids.length;
    const countEmitter = flagStore.getEmitter(nameof(flagStore.store.dbUpdateCount))

    countEmitter(remaining)
    try {
        const response = await getPlayerInfoStream(ids,updateCancellation.signal, (data) => {
            accs.get(data.steamId).assignInfo(data)
            countEmitter(--remaining)
            delayedSaveAccounts()
        })

        if(response) {
            toast.open({ body: "Accounts updated successfully", variant: ToastVariant.Success })
        }
    } catch (err) {
        if(err.name !== "AbortError") {
            toast.open({
                body: `Failed updating accounts. Some accounts have not been updated (${remaining})`,
                variant: ToastVariant.Error
            })
        }
    }

    updateCancellation = undefined;
    countEmitter(0)
    updateEmitter(false)
}