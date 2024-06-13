import {Backup, backupStorages} from "@/types/backup.ts";
import {accounts, getEncryptedAccounts} from "@/store/config.ts";
import {fileTypes, gDriveSaveFile} from "@/services/gDrive.ts";


export const storeDb = async (name:string=null, storage=backupStorages.gDrive)=>{
    const date = new Date();
    const backup: Backup = {
        date: date,
        name:name?name:date.toISOString(),
        accAmount: accounts.length,
        accounts: getEncryptedAccounts()
    };
    const filePrefix= name?"backup_":"auto_";
    switch (storage){
        case backupStorages.gDrive:
            await gDriveSaveFile(filePrefix+backup.name+".json", backup,fileTypes.backup);
            break;
    }
}