import { MdVpnKey  } from "react-icons/md";
import { FaInfo } from "react-icons/fa6";
import InputWrapper from "../../components/elements/InputWrapper.tsx";
import {PasswordBox} from "../../components/elements/PasswordBox.tsx";
import {deriveKey, exportKey} from "../../services/cryptography.ts";
import {config, saveConfig} from "../../store/config.ts";
import useModal from "../../hooks/useModal.ts";
import LoadingButton from "../../components/elements/Button.tsx";
import {passwordValidator, useInputValidate} from "../../hooks/useInputValidate.ts";

export default function Authentication(){
    const { closeModal } = useModal()
    const [inputRef, messageRef, validateRef]
        = useInputValidate([ passwordValidator ]);

    return (
        <div className="flex flex-col items-center w-full">
            <div className="text-[12px] text-fg-2 relative pl-5 text-justify pr-2 mb-3">
                <FaInfo size={18} className="text-fg-3 absolute -left-0.5 top-0.5"/>
                <span>Enter a new password to encrypt your accounts, this is a required step. Enter a password that you 100% remember. If you forget your password, you will permanently lose access to your data.</span>
            </div>
            <InputWrapper ref={messageRef} title="Password" className="mb-7 w-full" icon={<MdVpnKey size={18}/>}>
                <PasswordBox ref={inputRef}/>
            </InputWrapper>
            <LoadingButton defaultTitle="Confirm" loadingTitle="Preparing . . ." className="w-full max-w-36"
                           onClick={async ({currentTarget}) => {
                               if(!validateRef.current!()) {
                                   return
                               }
                               currentTarget.disabled = true
                               config.encryptionKey = await exportKey(
                                   await deriveKey({secret: inputRef.current!.value, extractable: true}))
                               await saveConfig()
                               currentTarget.disabled = false
                               closeModal()
                           }}
            />
        </div>
    )
}