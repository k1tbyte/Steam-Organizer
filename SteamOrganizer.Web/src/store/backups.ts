import {ObservableObject} from "@/lib/observableObject.ts";
import {BackupInfo, BackupMetadata} from "@/types/backup.ts";
import {getFileJson, getFileList, uploadFileJson} from "@/services/gDrive.ts";
import {accounts, exportAccounts, loadAccounts} from "@/store/accounts.ts";
import {bufferToBase64, jsonIgnoreNull} from "@/lib/utils.ts";
import {EDecryptResult} from "@/store/config.ts";
import {toast, ToastVariant} from "@/components/primitives/Toast.tsx";

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

export const storeBackup = async () => {
    const backupData: BackupInfo = {
        accountCount: accounts.data.length,
        data: bufferToBase64(await exportAccounts())
    };

    const date = new Date()
    const fileName =  "auto_backup_" + date.toISOString()
    const remoteFile = await uploadFileJson(`${backupsFolderName}/${fileName}`, backupData)
    backups.mutate(data => {
        data.push({
            date: date,
            fileId: remoteFile.result.id,
            name: remoteFile.result.name
        })
    })
}

export const restoreBackup = async (backup: BackupInfo) => {
    const binString = atob(backup.data);
    const bytes = Uint8Array.from(binString, m => m.codePointAt(0)!);
    const result = await loadAccounts(bytes.buffer);
    if(result !== EDecryptResult.Success) {
        toast.open({ body: "Unable to restore backup", variant: ToastVariant.Error })
    }
}