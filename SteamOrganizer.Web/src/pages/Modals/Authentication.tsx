import {InputValidationWrapper} from "@/components/FieldWrapper";
import {PasswordBox} from "@/shared/ui/PasswordBox";
import {decrypt, deriveKey} from "@/shared/services/cryptography";
import Button, {EButtonVariant, type IButtonActions} from "@/shared/ui/Button";
import {useFormValidation, validators} from "@/shared/hooks/useFormValidation";
import React, {type FC, useEffect, useRef, useState} from "react";
import {modal, useModalActions} from "@/shared/ui/Modal";
import {Icon, SvgIcon} from "src/defines";
import {useAuth} from "@/providers/authProvider";
import {getLatestBackup, loadBackup, restoreBackup} from "@/store/backups";
import {Loader} from "@/shared/ui/Loader";
import {dateFormatter} from "@/shared/lib/timeFormatting";
import { clearAccounts, importAccounts, initAccounts, storeEncryptionKey} from "@/store/accounts";
import {Tooltip} from "@/shared/ui/Popup/Tooltip";
import {EDecryptResult} from "@/store/config";
import {InfoNote} from "@/pages/Modals/elements/InfoNote";

interface IDecryptProps {
    info: string,
    onSuccess: (key: CryptoKey, data?: string) => (void | Promise<void>),
    decryptData?: ArrayBuffer,
    resetText?: string,
    onReset?: () => void,
    resetTapsCount?: number;
    preventClosing?: boolean;
}

interface IAuthorizationProps {
    reason: EDecryptResult,
    buffer: ArrayBuffer | undefined
}

export const Authorization: FC<IAuthorizationProps> = ({ reason,  buffer}) => {
    const [hasKey, setHasKey] =
        useState(reason === EDecryptResult.NeedAuth || reason === EDecryptResult.BadCredentials)
    const [restoring, setRestoring] = useState(false)
    const [backup,setBackup] =
        useState<{ date: Date, accountCount: number, buffer: ArrayBuffer  }>(null)

    const { user, signIn } = useAuth();

    useEffect(() => {
        if(!user.isLoggedIn || hasKey) {
            return;
        }
        getLatestBackup().then(async (o) => {
            if(!o) {
                setBackup(undefined);
                return;
            }
            const backup = await loadBackup(o.id)
            setBackup({
                accountCount: backup.accountCount,
                date: new Date(o.createdTime) ,
                buffer: await restoreBackup(backup)
            });
        })
    },[user.isLoggedIn, hasKey])

    const onSuccess = async (k: CryptoKey, i: string) => {
        await storeEncryptionKey(k)
        await importAccounts(i, true)
    }

    if(hasKey) {
        return <DecryptionPopup info={reason === EDecryptResult.NeedAuth ?
            "It seems you have changed your browser. Please re-enter your password" :
            "For various reasons, the data could not be decrypted, please enter the password"
        } onSuccess={onSuccess} resetTapsCount={3}
                                resetText="Reset"
                                preventClosing
                                onReset={() => {
                                    clearAccounts().then(() => setHasKey(false))
                                    buffer = undefined
                                }} decryptData={buffer}/>
    }

    if(restoring && backup) {
        return <DecryptionPopup
            info="Enter the password for the current backup. The entered password will also be used in the future when saving and other operations"
            resetText="Cancel"
            preventClosing
            onSuccess={onSuccess}
            decryptData={backup.buffer}
            onReset={() => setRestoring(false)}/>
    }

    return (
        <>
            <DecryptionPopup info="Enter a new password to encrypt your accounts, this is a required step. Enter a password that you 100% remember. If you forget your password, you will permanently lose access to your accounts" onSuccess={async (e) => {
                await storeEncryptionKey(e);
                initAccounts()
            }}/>
            <div role="separator" className="bg-background h-0.5 -mx-2.5 my-3"/>

            <div className="flex-center">
                {user.isLoggedIn ?
                    backup === null ? <Loader size={20}/> :
                        backup === undefined ?
                        <span className="text-center text-foreground-muted font-bold">No backups to restore</span> :
                            <div className="flex-y-center  text-foreground text-2xs">
                                <p>You can restore latest backup, it contains {backup.accountCount} account(s)
                                    <br/>
                                    <span className="text-xs opacity-60">{dateFormatter.format(new Date(backup.date))}</span>
                                </p>
                                <Button variant={EButtonVariant.Outlined}
                                        onClick={() => setRestoring(true)}>
                                    Restore
                                </Button>
                            </div> :
                    <Button onClick={signIn}
                            variant={EButtonVariant.Outlined}
                            className="py-2 px-4 gap-2 flex-center">
                        Sync with Google Drive
                        <SvgIcon icon={Icon.GoogleDrive} size={20}/>
                    </Button>
                }
            </div>
        </>
    )
}

export const DecryptionPopup: FC<IDecryptProps> = (props) => {

    const onSubmit = async () => {
        submitActions.current!.setLoading(true)
        if(!props.decryptData) {
            props.onSuccess(
                await deriveKey({secret: inputRef.current!.value.trimEnd(), extractable: true}))
            closeModal()
            return
        }
        await tryDecrypt();
        submitActions.current!.setLoading(false)
    }

    const formRef = useFormValidation([validators.password], onSubmit)
    const { closeModal } = useModalActions<HTMLFormElement>(formRef);
    const inputRef = useRef<HTMLInputElement>(null);
    const resetTooltipRef = useRef<HTMLDivElement>(null);
    const submitActions = useRef<IButtonActions>()
    let tapCount = props.resetTapsCount


    const tryDecrypt = async () => {
        const key = await deriveKey({secret: inputRef.current!.value.trimEnd(), extractable: true})
        try {
            await props.onSuccess(key, await decrypt(key,props.decryptData!));
            closeModal()
        } catch {
            inputRef.current!.value = "";
            submitActions.current!.invalidate(700)
        }
    }

    const getResetMessage = () => "Click " + tapCount + " more time(s) to reset.\nAll data will be lost!"

    return (
        <form style={{maxWidth: "280px"}} ref={formRef}>
            <InfoNote title={props.info}/>
            <InputValidationWrapper title="Password" className="mb-7 w-full"
                          icon={<SvgIcon icon={Icon.Key} size={18}/>}>
                <PasswordBox validator={validators.password} ref={inputRef}/>
            </InputValidationWrapper>
            <div className="flex gap-3">
                { props.resetText &&
                    <Tooltip className="text-center" message={tapCount ? getResetMessage : null} ref={resetTooltipRef}>
                        <Button type="button" className={props.resetTapsCount ? "bg-danger" : ""} children={props.resetText}
                                onClick={() => {
                                    if(tapCount > 1) {
                                        tapCount--;

                                        if(resetTooltipRef.current) {
                                            resetTooltipRef.current.textContent = getResetMessage()
                                        }
                                        return
                                    }
                                    props.onReset()
                                    if(!props.preventClosing) {
                                        closeModal()
                                    }
                                }}/>
                    </Tooltip>
                }
                <Button children="Confirm" className="mx-auto" actions={submitActions}/>
            </div>
        </form>
    )
}

export const openAuthPopup = (props: IAuthorizationProps ) => {
    modal.open({
        body: <Authorization {...props}/>,
        onClosing: () => true,
        title: "Authentication",
        withCloseButton: false,
        className: "max-w-[305px] w-full"
    })
}