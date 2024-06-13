export type Backup={
    name:string;
    date:Date;
    accAmount:number;
    accounts:string;
}
export const enum backupStorages {
    gDrive,
}