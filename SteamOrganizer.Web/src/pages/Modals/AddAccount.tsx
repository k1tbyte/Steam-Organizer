import {type FC, useRef} from "react";
import {useModalActions} from "@/components/primitives/Modal.tsx";
import InputWrapper from "@/components/elements/InputWrapper.tsx";
import {PasswordBox} from "@/components/primitives/PasswordBox.tsx";
import Input from "@/components/primitives/Input.tsx";
import Button, {type IButtonActions} from "@/components/primitives/Button.tsx";
import {Icon, SvgIcon} from "@/assets";
import {Account} from "@/entity/account.ts";
import {accounts, isAccountCollided, saveAccounts} from "@/store/accounts.ts";
import {toAccountId} from "@/lib/steamIdConverter.ts";
import {useFormValidation, validator} from "@/hooks/useInputValidation.ts";
import {toast, ToastVariant} from "@/components/primitives/Toast.tsx";

interface IAddAccountProps {

}

export const AddAccount: FC<IAddAccountProps> = () => {
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
                errorIdRef.current.textContent = "Account with this id not found"
                return
            }

            const collision = isAccountCollided(id, login)
            if(collision) {
                const error = collision[0] ? errorIdRef.current : errorLoginRef.current;
                error.textContent = `Account with same ${collision[0] ? 'id' : 'login'} already exists`
                return
            }
            const account = await Account.new(login, formData.get("password").toString(), id)
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
        validator.login,
        validator.password,
        (s) => (!s || s.length > 1) ? null : "Enter valid id"
    ], addClick)

    return (
        <div ref={contentRef}>
            <form className="w-[280px]" ref={formValidation}>
                <InputWrapper title="Login" ref={errorLoginRef} className="mb-2 w-full" icon={<SvgIcon icon={Icon.UserText} size={18}/>}>
                    <Input name="login"/>
                </InputWrapper>
                <InputWrapper title="Password" className="mb-2 w-full" icon={<SvgIcon icon={Icon.Key} size={18}/>}>
                    <PasswordBox  name="password"/>
                </InputWrapper>
                <InputWrapper title="Steam ID in any format" className="mb-7 w-full" ref={errorIdRef}
                              icon={<SvgIcon icon={Icon.Identifier} size={36}/>}>
                    <Input name="id"/>
                </InputWrapper>
                <Button actions={submitActions} className="w-full max-w-28 mx-auto" type="submit">
                    Add
                </Button>
            </form>
        </div>
    )
}