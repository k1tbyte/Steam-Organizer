import {Backup, backupStorages} from "@/types/backup.ts";
import {accounts, getEncryptedAccounts, restoreEncryptedAccounts} from "@/store/config.ts";
import {fileTypes, gDriveGetFileContent, gDriveSaveFile} from "@/services/gDrive.ts";


export const storeDb = async (name:string, storage=backupStorages.gDrive)=>{
    const date = new Date();
    const backup: Backup = {
        //date: date,
        //name:name?name:date.toISOString(),
        accAmount: accounts.length,
        accounts: await getEncryptedAccounts()
    };

    const fileName =name?"backup_"+name+".json":
        "auto_"+date.toISOString()+".json";
    switch (storage){
        case backupStorages.gDrive:
            await gDriveSaveFile(fileName, backup,fileTypes.backup);
            break;
    }
}
export const restoreDb = async (backupId:string,storage=backupStorages.gDrive) =>{
    switch (storage){
        case backupStorages.gDrive:
            const fileContent= await gDriveGetFileContent(backupId);
            const backup:Backup = JSON.parse(fileContent);
            await restoreEncryptedAccounts(backup.accounts);
            break
    }
}