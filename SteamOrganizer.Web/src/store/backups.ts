import {ObservableObject} from "@/shared/lib/observer/observableObject";
import {BackupInfo, BackupMetadata} from "@/types/backup";
import {getFileJson, getFileList, uploadFileJson} from "@/shared/services/gDrive";
import {accounts, exportAccounts} from "@/store/accounts";
import {bufferToBase64} from "@/shared/lib/utils";

const backupsFolderName = "Backups"

export const backups = new ObservableObject<BackupMetadata[]>([])


export const loadBackups = async () => {
    const list = await getFileList(backupsFolderName,100);
    const chunk: BackupMetadata[] = []
    for (const file of list.result.files) {
        chunk.push({
            date: new Date(file.createdTime),
            fileId: file.id,
            name: file.name
        })
    }
    backups.set(chunk)
}

export const loadBackup = (id: string) => {
    return getFileJson<BackupInfo>(id)
}

export const getLatestBackup = async () => {
    const backup = await getFileList(backupsFolderName,1);
    return backup.result.files?.[0];
}

export const storeBackup = async (timestamp: Date = new Date()) => {
    if(accounts.value.length === 0) {
        return;
    }

    const backupData: BackupInfo = {
        accountCount: accounts.value.length,
        data: bufferToBase64(await exportAccounts())
    };

    const fileName =  `auto (+${accounts.value.length})`
    const remoteFile = await uploadFileJson(`${backupsFolderName}/${fileName}`, backupData)
    backups.mutate(data => {
        data.push({
            date: timestamp,
            fileId: remoteFile.result.id,
            name: remoteFile.result.name
        })
    })
}

export const restoreBackup = async (backup: BackupInfo) => {
    const binString = atob(backup.data);
    return Uint8Array.from(binString, m => m.codePointAt(0)!).buffer;
   // return await loadAccounts(bytes.buffer);
}