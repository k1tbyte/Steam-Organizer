import React, {type FC, useRef} from "react";
import {modal, useModalActions} from "@/shared/ui/Modal.tsx";
import { InputValidationWrapper } from "@/components/FieldWrapper.tsx";
import {PasswordBox} from "@/shared/ui/PasswordBox.tsx";
import Input from "@/shared/ui/Input.tsx";
import Button, {type IButtonActions} from "@/shared/ui/Button.tsx";
import {Icon, SvgIcon} from "src/defines";
import {Account} from "@/entity/account.ts";
import {accounts, isAccountCollided, saveAccounts} from "@/store/accounts.ts";
import {toAccountId} from "@/shared/lib/steamIdConverter.ts";
import {useFormValidation, validators} from "@/shared/hooks/useFormValidation.ts";
import {toast, ToastVariant} from "@/shared/ui/Toast.tsx";
import {useIsOffline} from "@/store/local.tsx";
import {config} from "@/store/config.ts";
import {openSettings} from "@/pages/Modals/Settings.tsx";


export const openAddAccount = () => {
    if(!config.steamApiKey) {
        toast.open({
            body: "Steam API key not specified. Do this in settings",
            variant: ToastVariant.Warning,
            id: "noApiKey",
            clickAction: openSettings
        })
        return;
    }
    modal.open({
        title: "New account",
        body: <AddAccount/>
    })
}

export const AddAccount: FC = () => {
    const errorIdRef = useRef<HTMLDivElement>()
    const errorLoginRef = useRef<HTMLDivElement>()
    const { closeModal, contentRef }  = useModalActions<HTMLDivElement>();
    const submitActions = useRef<IButtonActions>();
    const isOffline = useIsOffline()

    const addClick = async (e) => {
        try {
            submitActions.current.setLoading(true)
            const formData = new FormData(e.currentTarget);
            const steamId = formData.get("id").toString();
            const login = formData.get("login").toString();
            const id = await toAccountId(steamId)


            if(id === 0) {
                errorIdRef.current.textContent = "Unknown steam id format"
                return
            }

            const collision = isAccountCollided(id, login)
            if(collision) {
                const error = collision[0] ? errorIdRef.current : errorLoginRef.current;
                error.textContent = `Account with same ${collision[0] ? 'id' : 'login'} already exists`
                return
            }
            const account = await new Account(login, formData.get("password").toString(), id).update()
            if(!account) {
                return
            }

            accounts.mutate((o) => {
                o.push(account)
                saveAccounts()
            })

            closeModal()
        }
        finally {
            submitActions.current.setLoading(false)
        }
    }

    const formValidation = useFormValidation([
        validators.login,
        validators.password,
        (s) => (!s || s.length > 1) ? null : "Enter valid id"
    ], addClick)

    return (
        <div ref={contentRef}>
            <form className="w-[280px]" ref={formValidation}>

                <InputValidationWrapper className="mb-2 w-full"  ref={errorLoginRef}
                                        title="Login"
                                        icon={<SvgIcon icon={Icon.UserText} size={18}/>}>
                    <Input name="login"/>
                </InputValidationWrapper>

                <InputValidationWrapper className="mb-2 w-full"
                                        title="Password"
                                        icon={<SvgIcon icon={Icon.Key} size={18}/>}>
                    <PasswordBox name="password"/>
                </InputValidationWrapper>

                { !isOffline &&
                    <InputValidationWrapper className="mb-7 w-full" ref={errorIdRef}
                                            title="Steam ID in any format"
                                            icon={<SvgIcon icon={Icon.Identifier} size={36}/>}>
                        <Input name="id"/>
                    </InputValidationWrapper>
                }


                <Button actions={submitActions} className="w-full max-w-28 mx-auto" type="submit">
                    Add
                </Button>
            </form>
        </div>
    )
}