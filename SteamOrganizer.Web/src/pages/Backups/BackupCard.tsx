import {FC} from "react";
import {Icon, SvgIcon} from "@/assets";
import {BackupMetadata} from "@/types/backup.ts";
import {deleteFile} from "@/services/gDrive.ts";
import {backups} from "@/store/backups.ts";

interface IBackupProps{
    backup: BackupMetadata
}

 const  BackupCard: FC<IBackupProps> = ({backup}) => {
    return(
        <div className="flex min-h-[105px] w-full bg-primary  p-4 pr-10 rounded-[3px] relative">
            <div className="ml-3 flex flex-col justify-center">
                <div className="inline-flex">

                    <span className="text-[14px]">{backup.name}</span>
                    <img src="https://img.icons8.com/fluency/48/google-drive--v2.png"
                         alt=""
                         className="ml-3 h-[20px] w-[20px]"/>
                </div>

                <div className="">
                    <span className="text-foreground text-xs font-medium w-full"><b className="text-secondary">Date :</b> {backup.date.toLocaleString()}</span>
                </div>
            </div>
            <SvgIcon icon={Icon.BackupRestore} className="absolute text-foreground-muted right-3 top-3 hover:text-blue-500 btn" size={23}/>
            <SvgIcon icon={Icon.Trash} className="absolute text-foreground-muted right-3 bottom-3 hover:text-failed btn"
                     onClick={async () => {
                         backups.mutate(data => {
                             data.splice(data.indexOf(backup), 1)
                         })
                         await deleteFile(backup.fileId)
                     }}
                     size={23}/>

        </div>
    )
}

export default BackupCard