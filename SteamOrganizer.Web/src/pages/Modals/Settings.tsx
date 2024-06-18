import {FC} from "react";
import InputWrapper from "@/components/elements/InputWrapper.tsx";
import {Icon, SvgIcon} from "@/assets";
import {PasswordBox} from "@/components/primitives/PasswordBox.tsx";
import {useInputValidate, validator} from "@/hooks/useInputValidate.ts";
import {config, saveConfig} from "@/store/config.ts";

export const Settings: FC = () => {
    const [inputRef, messageRef] = useInputValidate([
        (input) => input.length === 0 ? null : validator.steamApiKey(input)
    ],  (i) => {
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