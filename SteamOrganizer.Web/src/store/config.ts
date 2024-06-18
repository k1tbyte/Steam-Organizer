import FingerprintJS from "@fingerprintjs/fingerprintjs";
import db from "../services/indexedDb.ts"
import {decrypt, deriveKey, encrypt, exportKey, importKey} from "../services/cryptography.ts";
import {Account} from "@/types/account.ts";
import {BackupInfo} from "@/types/backup.ts";
import {gDriveGetBackupsInfo} from "@/services/gDrive.ts";
import {parseISO} from "date-fns";

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
export const accounts: Account[] = [];
export const backupsInfo: BackupInfo[] = [];

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
export const getEncryptedAccounts = async () =>{
    const arrayBuffer = await encrypt(databaseKey!, JSON.stringify(accounts));
    return btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
}
export const restoreEncryptedAccounts = async (encryptedAccounts:string) =>{
    const binString = atob(encryptedAccounts);
    const arrayBuffer:ArrayBuffer = Uint8Array.from(binString, (m) => m.codePointAt(0)!);
    const data= await decrypt(databaseKey!,arrayBuffer);
    accounts.splice(0,accounts.length);
    accounts.push(JSON.parse(data));
}
export const loadBackupsInfo = async ()=>{
    const response = await gDriveGetBackupsInfo();
    backupsInfo.splice(0,backupsInfo.length);
    const files = response?.result?.files!;
    for (const file of files){
        const backupInfo:BackupInfo={
            name:file.name,
            fileId:file.id,
            date:parseISO(file.createdTime!)
        }
        backupsInfo.push(backupInfo);
    }
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
        return EDecryptResult.Success
    }

    try {
        const data = await decrypt(databaseKey, dbBytes);
        accounts.push(JSON.parse(data))
        return EDecryptResult.Success
    } catch {
        return EDecryptResult.BadCredentials
    }
    //decrypt
}