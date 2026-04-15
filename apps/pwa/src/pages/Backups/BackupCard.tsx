import {FC} from "react";
import {Icon, SvgIcon} from "src/defines";
import {BackupMetadata} from "@/types/backup";
import {ConfirmPopup} from "@/components/ConfirmPopup";
import {modal} from "@/shared/ui/Modal";
import {BackupRestoring} from "@/pages/Modals/BackupRestoring";
import {backups} from "@/store/backups";
import {deleteFile} from "@/shared/services/gDrive";
import styles from './BackupCard.module.css';

interface IBackupProps {
    backup: BackupMetadata
}

const BackupCard: FC<IBackupProps> = ({backup}) => {
    const openRestoring = () => {
        modal.open({
            title: "Restoring " + backup.name,
            body: <BackupRestoring backup={backup}/>
        })
    }

    const handleDelete = async () => {
        backups.mutate(data => {
            data.splice(data.indexOf(backup), 1)
        })
        await deleteFile(backup.fileId)
    }

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                    <div className={styles.name}>{backup.name}</div>
                    <div className={styles.date}>
                        <span className={styles.dateLabel}>Date :</span>
                        {' '}
                        {backup.date.toLocaleString()}
                    </div>
            </div>

            <SvgIcon
                icon={Icon.BackupRestore}
                role="button"
                onClick={openRestoring}
                className={styles.restoreButton}
                size={23}
            />

            <ConfirmPopup
                text="Are you sure you want to delete this backup?"
                onYes={handleDelete}
            >
                <SvgIcon
                    icon={Icon.Trash}
                    role="button"
                    className={styles.deleteButton}
                    size={23}
                />
            </ConfirmPopup>
        </div>
    )
}

export default BackupCard