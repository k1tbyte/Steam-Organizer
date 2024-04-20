import {MdVpnKey} from "react-icons/md";
import {FaInfo} from "react-icons/fa6";
import InputWrapper from "../../components/elements/InputWrapper.tsx";
import {PasswordBox} from "../../components/elements/PasswordBox.tsx";
import {decrypt, deriveKey } from "../../services/cryptography.ts";
import Button, { IButtonActions} from "../../components/elements/Button.tsx";
import {passwordValidator, useInputValidate} from "../../hooks/useInputValidate.ts";
import {FC} from "react";
import MutableRef from "../../types/mutableRef.ts";
import useModal from "../../hooks/useModal.ts";

interface IAuthProps {
    info: string,
    onSuccess: (key: CryptoKey, data?: string) => void,
    decryptData?: ArrayBuffer,
    allowReset?: boolean,
}

const Authentication : FC<IAuthProps> = (props) => {
    const {closeModal} = useModal();
    const [inputRef, messageRef, validateRef]
        = useInputValidate([ passwordValidator ]);

    const submitActions = new MutableRef<IButtonActions>()

    const tryDecrypt = async () => {
        const key = await deriveKey({ secret: inputRef.current!.value, extractable: true })
        try {
            props.onSuccess(key, await decrypt(key, props.decryptData!));
            closeModal()
        } catch {
            inputRef.current!.value = "";
            submitActions.payload!.invalidate(700)
        }
    }

    return (
        <div className="flex flex-col items-center w-full">
            <div className="text-[12px] text-fg-2 relative pl-5 text-justify pr-2 mb-3">
                <FaInfo size={18} className="text-fg-3 absolute -left-0.5 top-0.5"/>
                <span>{props.info}</span>
            </div>
            <InputWrapper ref={messageRef} title="Password" className="mb-7 w-full" icon={<MdVpnKey size={18}/>}>
                <PasswordBox ref={inputRef}/>
            </InputWrapper>
            <Button children="Confirm" className="w-full max-w-36" actions={submitActions}
                           onClick={async () => {
                               if(!validateRef.current!()) {
                                   return
                               }
                               submitActions.payload!.setLoading(true)
                               if(props.decryptData === undefined) {
                                   props.onSuccess(
                                       await deriveKey({secret: inputRef.current!.value, extractable: true}))
                                   closeModal()
                                   return
                               }
                               await tryDecrypt();
                               submitActions.payload!.setLoading(false)
                           }}
            />
        </div>
    )
}

export default Authentication;