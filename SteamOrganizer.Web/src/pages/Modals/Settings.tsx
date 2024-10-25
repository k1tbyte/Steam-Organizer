import {FC} from "react";
import InputWrapper from "@/components/elements/InputWrapper.tsx";
import {Icon, SvgIcon} from "@/assets";
import {PasswordBox} from "@/components/primitives/PasswordBox.tsx";
import {useInputValidation, validator} from "@/hooks/useInputValidation.ts";
import {config, saveConfig} from "@/store/config.ts";
import {modal} from "@/components/primitives/Modal.tsx";

export const openSettings = () => {
    modal.open({
        title: "Settings",
        body: <Settings/>
    })
}

export const Settings: FC = () => {
    const [inputRef, messageRef] = useInputValidation(
        input => input.length === 0 ? null : validator.steamApiKey(input),
        i => {
        if(config.steamApiKey === i) {
            return
        }
        config.steamApiKey = i;
        return saveConfig()
    })

    return (
        <div>
            <InputWrapper ref={messageRef} title="Steam API key" icon={<SvgIcon icon={Icon.Api} size={24}/>}>
                <PasswordBox ref={inputRef} defaultValue={config.steamApiKey}/>
            </InputWrapper>
        </div>
    )
}