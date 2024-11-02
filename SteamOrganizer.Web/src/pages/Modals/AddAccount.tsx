import {type FC, useRef} from "react";
import {useModalActions} from "@/components/primitives/Modal.tsx";
import { InputValidationWrapper } from "@/components/elements/FieldWrapper.tsx";
import {PasswordBox} from "@/components/primitives/PasswordBox.tsx";
import Input from "@/components/primitives/Input.tsx";
import Button, {type IButtonActions} from "@/components/primitives/Button.tsx";
import {Icon, SvgIcon} from "@/assets";
import {Account} from "@/entity/account.ts";
import {accounts, isAccountCollided, saveAccounts} from "@/store/accounts.ts";
import {toAccountId} from "@/lib/steamIdConverter.ts";
import {useFormValidation, validators} from "@/hooks/useFormValidation.ts";
import {toast, ToastVariant} from "@/components/primitives/Toast.tsx";

export const AddAccount: FC = () => {
    const errorIdRef = useRef<HTMLDivElement>()
    const errorLoginRef = useRef<HTMLDivElement>()
    const { closeModal, contentRef }  = useModalActions<HTMLDivElement>();
    const submitActions = useRef<IButtonActions>();

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
                toast.open({ body: "Failed to retrieve account information", variant: ToastVariant.Error })
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

                <InputValidationWrapper className="mb-7 w-full" ref={errorIdRef}
                                        title="Steam ID in any format"
                                        icon={<SvgIcon icon={Icon.Identifier} size={36}/>}>
                    <Input name="id"/>
                </InputValidationWrapper>

                <Button actions={submitActions} className="w-full max-w-28 mx-auto" type="submit">
                    Add
                </Button>
            </form>
        </div>
    )
}