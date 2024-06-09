import InputWrapper from "@/components/elements/InputWrapper.tsx";
import {PasswordBox} from "@/components/primitives/PasswordBox.tsx";
import {decrypt, deriveKey } from "@/services/cryptography.ts";
import Button, { IButtonActions} from "@/components/primitives/Button.tsx";
import {passwordValidator, useInputValidate} from "@/hooks/useInputValidate.ts";
import {FC} from "react";
import MutableRef from "@/types/mutableRef.ts";
import {useModalActions} from "@/components/primitives/Modal.tsx";
import {Icon, SvgIcon} from "@/assets";

interface IAuthProps {
    info: string,
    onSuccess: (key: CryptoKey, data?: string) => void,
    decryptData?: ArrayBuffer,
    allowReset?: boolean,
}

const Authentication : FC<IAuthProps> = (props) => {
    const [inputRef, messageRef, validateRef]
        = useInputValidate([ passwordValidator ]);
    const { closeModal, contentRef }  = useModalActions();

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
        <div className="flex flex-col items-center w-full" ref={contentRef}>
            <div className="text-[12px] text-foreground relative pl-5 text-justify pr-2 mb-3">
                <SvgIcon icon={Icon.InfoMark} size={18} className="text-foreground-accent absolute -left-0.5 top-0.5"/>
                <span>{props.info}</span>
            </div>
            <InputWrapper ref={messageRef} title="Password" className="mb-7 w-full" icon={<SvgIcon icon={Icon.Key} size={18}/>}>
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