import {FC} from "react";
import {Icon, SvgIcon} from "src/defines";
import {BackupMetadata} from "@/types/backup.ts";
import {deleteFile} from "@/shared/services/gDrive.ts";
import {backups} from "@/store/backups.ts";
import {ConfirmPopup} from "@/components/ConfirmPopup.tsx";
import {modal} from "@/shared/ui/Modal.tsx";
import {BackupRestoring} from "@/pages/Modals/BackupRestoring.tsx";

interface IBackupProps{
    backup: BackupMetadata
}

 const  BackupCard: FC<IBackupProps> = ({backup}) => {
    const openRestoring = () => {
        modal.open({
            title: "Restoring "  + backup.name,
            body: <BackupRestoring backup={backup}/>
        })
    }
    return(
        <div className="flex min-h-[105px] w-full bg-primary  p-4 pr-10 rounded-[3px] relative">
            <div className="ml-3 flex flex-col justify-center">
                <div className="inline-flex">
                    <span className="text-[14px]">{backup.name}</span>
                </div>

                <div className="">
                    <span className="text-foreground text-xs font-medium w-full"><b className="text-secondary">Date :</b> {backup.date.toLocaleString()}</span>
                </div>
            </div>
            <SvgIcon icon={Icon.BackupRestore} role="button" onClick={openRestoring}
                     className="absolute text-foreground-muted right-3 top-3 hover:text-blue-500 btn" size={23}/>
            <ConfirmPopup text="Are you sure you want to delete this backup?" onYes={async () => {
                backups.mutate(data => {
                    data.splice(data.indexOf(backup), 1)
                })
                await deleteFile(backup.fileId)
            }}>
                <SvgIcon icon={Icon.Trash} role="button"
                         className="absolute text-foreground-muted right-3 bottom-3 hover:text-danger btn"
                         size={23}/>
            </ConfirmPopup>

        </div>
    )
}

export default BackupCard