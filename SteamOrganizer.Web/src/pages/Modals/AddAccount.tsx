import {FC} from "react";
import {useModalActions} from "@/components/primitives/Modal.tsx";
import InputWrapper from "@/components/elements/InputWrapper.tsx";
import {PasswordBox} from "@/components/primitives/PasswordBox.tsx";
import Input from "@/components/primitives/Input.tsx";
import Button from "@/components/primitives/Button.tsx";
import {Icon, SvgIcon} from "@/assets";
import { actions } from "@/pages/Accounts/Accounts.tsx";
import {Account} from "@/types/account.ts";
import { accounts } from "@/store/config.ts";

interface IAddAccountProps {

}

export const AddAccount: FC<IAddAccountProps> = () => {
    const { closeModal, contentRef }  = useModalActions();

    const addClick = () => {
        actions.mutate(() =>
            accounts.push(new Account("test","test",1337n))
        )
        closeModal();
    }

    return (
        <div className="w-full" ref={contentRef}>
            <InputWrapper title="Login" className="mb-2 w-full" icon={<SvgIcon icon={Icon.UserText} size={18}/>}>
                <Input />
            </InputWrapper>
            <InputWrapper title="Password" className="mb-2 w-full" icon={<SvgIcon icon={Icon.Key} size={18}/>}>
                <PasswordBox />
            </InputWrapper>
            <InputWrapper title="Account ID in any format" className="mb-7 w-full"
                          icon={<SvgIcon icon={Icon.Identifier} size={36}/>}>
                <Input />
            </InputWrapper>
            <Button className="w-full max-w-28 mx-auto" onClick={addClick}>
                Add
            </Button>
        </div>
    )
}