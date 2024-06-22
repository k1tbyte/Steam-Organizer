import {FC} from "react";
import {useModalActions} from "@/components/primitives/Modal.tsx";
import InputWrapper from "@/components/elements/InputWrapper.tsx";
import {PasswordBox} from "@/components/primitives/PasswordBox.tsx";
import Input from "@/components/primitives/Input.tsx";
import Button from "@/components/primitives/Button.tsx";
import {Icon, SvgIcon} from "@/assets";
import {Account} from "@/entity/account.ts";
import {accounts, saveAccounts} from "@/store/accounts.ts";
import {toAccountId} from "@/lib/steamIdConverter.ts";
import {getPlayerInfo} from "@/services/steamApi.ts";

interface IAddAccountProps {

}

export const AddAccount: FC<IAddAccountProps> = () => {
    const { closeModal, contentRef }  = useModalActions<HTMLFormElement>();

    const addClick = async (e) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget);
        const id = toAccountId(formData.get("id").toString());
        const info =  await getPlayerInfo(id)
        const acc = new Account(
            formData.get("login").toString(),
            formData.get("password").toString(),id
        );
        acc.assign(info)
        console.log(acc)

        accounts.mutate((o) => {
            o.push(acc)
            saveAccounts()
        })
        closeModal();
    }

    return (
        <form className="w-full" ref={contentRef} onSubmit={addClick}>
            <InputWrapper title="Login" className="mb-2 w-full" icon={<SvgIcon icon={Icon.UserText} size={18}/>}>
                <Input name="login"/>
            </InputWrapper>
            <InputWrapper title="Password" className="mb-2 w-full" icon={<SvgIcon icon={Icon.Key} size={18}/>}>
                <PasswordBox  name="password"/>
            </InputWrapper>
            <InputWrapper title="Account ID in any format" className="mb-7 w-full"
                          icon={<SvgIcon icon={Icon.Identifier} size={36}/>}>
                <Input name="id"/>
            </InputWrapper>
            <Button className="w-full max-w-28 mx-auto" type="submit">
                Add
            </Button>
        </form>
    )
}