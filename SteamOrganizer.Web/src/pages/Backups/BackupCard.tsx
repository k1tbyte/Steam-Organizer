import {FC} from "react";
import {Icon, SvgIcon} from "@/assets";
import {restoreDb} from "@/services/sync.ts";
import {BackupInfo, backupStorages} from "@/types/backup.ts";
import {deleteFile} from "@/services/gDrive.ts";
import {backupsInfo} from "@/store/config.ts";

interface IBackupProps{
    info:BackupInfo
    icon?:string
}

 const  BackupCard: FC<IBackupProps> = ({info,icon}) => {
    return (
        <div className="flex min-h-[105px] w-full bg-primary  p-4 pr-10 rounded-[3px] relative">
            <div className="ml-3 flex flex-col justify-center">
                <div className="inline-flex">

                    <span className="text-[14px]">{info.name}</span>
                    <img src={icon}
                         alt=""
                         className="ml-3 h-[20px] w-[20px]"/>
                </div>

                <div className="">
                    <span className="text-foreground text-xs font-medium w-full"><b className="text-secondary">Date :</b> {info.date!.toLocaleString()}</span>
                </div>
            </div>
            <SvgIcon icon={Icon.BackupRestore} onClick={()=>onRestoreClick(info.fileId)} className="absolute text-foreground-muted right-3 top-3 hover:text-blue-500 btn" size={23}/>
            <SvgIcon icon={Icon.Trash} onClick={()=>onDeleteClick(info.fileId)} className="absolute text-foreground-muted right-3 bottom-3 hover:text-red-900 btn" size={23}/>

        </div>
    )
}
BackupCard.defaultProps={
    icon:"https://img.icons8.com/fluency/48/google-drive--v2.png",
}
export default BackupCard

const onRestoreClick=async (fileId:string)=>{
    await restoreDb(fileId,backupStorages.gDrive);
}
const onDeleteClick=async (fileId:string)=>{
    backupsInfo.splice(backupsInfo.findIndex(backup=>backup.fileId===fileId),1);
    await deleteFile(fileId);

}