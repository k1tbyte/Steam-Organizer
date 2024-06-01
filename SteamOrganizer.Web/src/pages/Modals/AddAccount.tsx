import {FC} from "react";
import {useModalActions} from "@/components/elements/Modal.tsx";
import InputWrapper from "@/components/elements/InputWrapper.tsx";
import {MdVpnKey} from "react-icons/md";
import {PasswordBox} from "@/components/elements/PasswordBox.tsx";
import { MdAlternateEmail } from "react-icons/md";
import Input from "@/components/elements/Input.tsx";
import Button from "@/components/elements/Button.tsx";

interface IAddAccountProps {

}

export const AddAccount: FC<IAddAccountProps> = () => {
    const { closeModal, contentRef }  = useModalActions();

    return (
        <div className="w-full" ref={contentRef}>
            <InputWrapper title="Login" className="mb-2 w-full" icon={<MdAlternateEmail size={18}/>}>
                <Input />
            </InputWrapper>
            <InputWrapper title="Password" className="mb-2 w-full" icon={<MdVpnKey size={18}/>}>
                <PasswordBox />
            </InputWrapper>
            <InputWrapper title="Account ID in any format" className="mb-7 w-full"
                          icon={<p className="font-bold font-code mb-0.5" >ID</p>}>
                <Input />
            </InputWrapper>
            <Button className="w-full max-w-28 mx-auto" onClick={closeModal}>
                Add
            </Button>
        </div>
    )
}