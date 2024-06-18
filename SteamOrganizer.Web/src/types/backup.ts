export type Backup={

    accAmount:number;
    accounts:string;
}
export type BackupInfo={
    name:string;
    date:Date;
    fileId:string;
}
export const enum backupStorages {
    gDrive,
}