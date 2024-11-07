import {FC} from "react";
import {InputValidationWrapper} from "@/components/elements/FieldWrapper.tsx";
import {Icon, SvgIcon} from "@/assets";
import {PasswordBox} from "@/components/primitives/PasswordBox.tsx";
import { validators} from "@/hooks/useFormValidation.ts";
import {config, delayedSaveConfig} from "@/store/config.ts";
import {modal} from "@/components/primitives/Modal.tsx";

export const openSettings = () => {
    modal.open({
        title: "Settings",
        body: <Settings/>
    })
}

export const Settings: FC = () => {
    return (
        <InputValidationWrapper title={
            <span className="cursor-pointer" onClick={() => window.open("https://steamcommunity.com/dev/apikey", '_blank')}>
                Steam API key
                <SvgIcon className="ml-1 mb-0.5 inline" icon={Icon.OpenLink} size={15}/>
            </span>}
                                icon={<SvgIcon icon={Icon.Api} size={24}/>}>
            <PasswordBox bindTo={config} bindKey={nameof(config.steamApiKey)}
                         onChanged={delayedSaveConfig}
                         validator={s => (s && validators.steamApiKey(s))} />
        </InputValidationWrapper>
    )
}