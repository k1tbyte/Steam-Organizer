import InputWrapper from "@/components/elements/InputWrapper.tsx";
import {PasswordBox} from "@/components/primitives/PasswordBox.tsx";
import {decrypt, deriveKey} from "@/services/cryptography.ts";
import Button, {EButtonVariant, type IButtonActions} from "@/components/primitives/Button.tsx";
import {useInputValidation, validator} from "@/hooks/useInputValidation.ts";
import React, {createElement, type FC, useEffect, useRef, useState} from "react";
import Ref from "@/types/ref.ts";
import {modal, useModalActions} from "@/components/primitives/Modal.tsx";
import {Icon, SvgIcon} from "@/assets";
import {useAuth} from "@/providers/authProvider.tsx";
import {getLatestBackup, loadBackup, restoreBackup} from "@/store/backups.ts";
import {Loader} from "@/components/primitives/Loader.tsx";
import {dateFormatter} from "@/lib/utils.ts";
import {clearAccounts, importAccounts, initAccounts, storeEncryptionKey} from "@/store/accounts.ts";
import {Tooltip} from "@/components/primitives/Tooltip.tsx";
import { EDecryptResult} from "@/store/config.ts";

interface IDecryptProps {
    info: string,
    onSuccess: (key: CryptoKey, data?: string) => void,
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
                                onReset={() =>
                                    clearAccounts().then(() => setHasKey(false))
                                } decryptData={buffer}/>
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
                            <div className="flex-y-center  text-foreground">
                                <p className="text-2xs">You can restore latest backup, it contains {backup.accountCount} account(s)
                                    <br/>
                                    <span className="text-xs opacity-60">{dateFormatter.format(new Date(backup.date))}</span>
                                </p>
                                <Button variant={EButtonVariant.Outlined}
                                        onClick={() => setRestoring(true)}>
                                    Restore
                                </Button>
                            </div> :
                    <Button onClick={signIn}
                            className="bg-transparent border-tertiary border text-secondary hover:text-success py-2 px-4 gap-2">
                        Sync with Google Drive
                        <SvgIcon icon={Icon.GoogleDrive} size={20}/>
                    </Button>
                }
            </div>
        </>
    )
}


export const DecryptionPopup: FC<IDecryptProps> = (props) => {
    const [inputRef, messageRef, validateRef]
        = useInputValidation(validator.password);
    const {closeModal, contentRef} = useModalActions<HTMLDivElement>();
    const resetTooltipRef = useRef<HTMLDivElement>(null);
    let tapCount = props.resetTapsCount

    const submitActions = new Ref<IButtonActions>()


    const tryDecrypt = async () => {
        const key = await deriveKey({secret: inputRef.current!.value.trimEnd(), extractable: true})
        try {
            props.onSuccess(key, await decrypt(key,props.decryptData!));
            closeModal()
        } catch {
            inputRef.current!.value = "";
            submitActions.payload!.invalidate(700)
        }
    }

    const getResetMessage = () => "Click " + tapCount + " more time(s) to reset.\nAll data will be lost!"

    return (
        <div className="flex flex-col items-center w-full" ref={contentRef}>
            <div className="text-[12px] text-foreground relative pl-5 text-justify pr-2 mb-3">
                <SvgIcon icon={Icon.InfoMark} size={18} className="text-foreground-accent absolute -left-0.5 top-0.5"/>
                <span>{props.info}</span>
            </div>
            <InputWrapper ref={messageRef} title="Password" className="mb-7 w-full"
                          icon={<SvgIcon icon={Icon.Key} size={18}/>}>
                <PasswordBox ref={inputRef}/>
            </InputWrapper>
            <div className="flex gap-3">
                { props.resetText &&
                    <Tooltip message={tapCount ? getResetMessage : null} ref={resetTooltipRef}>
                        <Button className={props.resetTapsCount ? "bg-danger" : ""} children={props.resetText}
                                onClick={() => {
                                    if(tapCount > 1) {
                                        tapCount--;
                                        resetTooltipRef.current.textContent = getResetMessage()
                                        return
                                    }
                                    props.onReset()
                                    if(!props.preventClosing) {
                                        closeModal()
                                    }
                                }}/>
                    </Tooltip>
                }
                <Button children="Confirm" className="w-full max-w-36" actions={submitActions}
                        onClick={async () => {
                            if (!validateRef.current!()) {
                                return
                            }
                            submitActions.payload!.setLoading(true)
                            if(props.decryptData === undefined) {
                                props.onSuccess(
                                    await deriveKey({secret: inputRef.current!.value.trimEnd(), extractable: true}))
                                closeModal()
                                return
                            }
                            await tryDecrypt();
                            submitActions.payload!.setLoading(false)
                        }}
                />
            </div>
        </div>
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