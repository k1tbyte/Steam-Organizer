import {type FC, useEffect, useState} from "react";
import { type BackupMetadata} from "@/types/backup.ts";
import Button from "@/components/primitives/Button.tsx";
import {Loader} from "@/components/primitives/Loader.tsx";
import {loadBackup, restoreBackup} from "@/store/backups.ts";
import {dateFormatter} from "@/lib/utils.ts";
import {decrypt} from "@/services/cryptography.ts";
import {modal, useModalActions} from "@/components/primitives/Modal.tsx";
import {databaseKey, importAccounts} from "@/store/accounts.ts";
import {DecryptionPopup} from "@/pages/Modals/Authentication.tsx";
import {router} from "@/providers/routerProvider.tsx";

interface IBackupRestoringProps {
    backup: BackupMetadata
}

export const BackupRestoring: FC<IBackupRestoringProps> = ({ backup }) => {
    const [restoredBackup,setBackup] =
        useState<{ date: Date, accountCount: number, buffer: ArrayBuffer  }>(null)
    const {closeModal, contentRef} = useModalActions<HTMLDivElement>();

    useEffect(() => {
        loadBackup(backup.fileId).then(async (o) => {
            setBackup({
                accountCount: o.accountCount,
                date: new Date(backup.date) ,
                buffer: await restoreBackup(o)
            });
        })
    },[])

    const onRestoring = async (o, data: string) => {
        await importAccounts(data, true);
        router("/accounts")
    }   

    return (
        <div className="min-w-[320px]" ref={contentRef}>
            { restoredBackup ?
                <>
                    <p className="text-foreground text-2xs">
                        <span className="text-secondary">Backup date:</span> {dateFormatter.format(restoredBackup.date)}
                        <br/>
                        <span className="text-secondary">Total accounts:</span> {restoredBackup.accountCount}
                        <br/>
                        <span className="text-secondary">Size:</span> {restoredBackup.buffer.byteLength / 1024} kb
                    </p>
                    <Button className="mx-auto mt-3" children="Restore" onClick={async () => {
                        try {
                            await onRestoring(null, await decrypt(databaseKey, restoredBackup.buffer));
                            closeModal()
                        } catch {
                            closeModal()
                            modal.open({
                                body: <DecryptionPopup decryptData={restoredBackup.buffer}
                                                       info="Enter the password to decrypt the backup"
                                                       onSuccess={onRestoring}/>,
                                title: "Decrypting backup"
                            })
                        }
                    }}/>
                </>
                : <Loader className="w-full flex-center py-3"/>
            }
        </div>
    )
}