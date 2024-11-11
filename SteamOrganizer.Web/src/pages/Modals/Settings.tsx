import {FC, useState} from "react";
import {ETitlePosition, FieldWrapper, InputValidationWrapper} from "@/components/elements/FieldWrapper.tsx";
import {Icon, SvgIcon} from "src/defines";
import {PasswordBox} from "@/components/primitives/PasswordBox.tsx";
import { validators} from "@/hooks/useFormValidation.ts";
import {config, delayedSaveConfig} from "@/store/config.ts";
import {modal} from "@/components/primitives/Modal.tsx";
import {steamBase} from "@/services/steamApi.ts";
import {CheckBox} from "@/components/primitives/CheckBox";
import {useAuth} from "@/providers/authProvider.tsx";

export const openSettings = () => {
    modal.open({
        title: "Settings",
        body: <Settings/>
    })
}

export const Settings: FC = () => {
    const { user } = useAuth();

    return (
        <form className="flex flex-col gap-2" onSubmit={(e) => e.preventDefault()} autoComplete={"off"}>
            <InputValidationWrapper title={
                <span className="cursor-pointer" onClick={() => window.open(`${steamBase}dev/apikey`, '_blank')}>
                Steam API key
                <SvgIcon className="ml-1 mb-0.5 inline" icon={Icon.OpenLink} size={15}/>
            </span>}
                                    icon={<SvgIcon icon={Icon.Api} size={24}/>}>
                <PasswordBox bindTo={config} bindKey={nameof(config.steamApiKey)}
                             onChanged={delayedSaveConfig}
                             validator={s => (s && validators.steamApiKey(s))}/>
            </InputValidationWrapper>

            { user.isLoggedIn &&
                <>
                    <FieldWrapper icon={<SvgIcon icon={Icon.FolderSync} size={20}/>}
                                  titlePos={ETitlePosition.Inline}
                                  title="Auto sync">
                        <CheckBox bindTo={config} bindKey={nameof(config.autoSync)} onChanged={delayedSaveConfig}/>
                    </FieldWrapper>
                    <FieldWrapper icon={<SvgIcon icon={Icon.PushBackupCloud} size={20}/>}
                                  titlePos={ETitlePosition.Inline}
                                  title="Make backups automatically">
                        <CheckBox bindTo={config} bindKey={nameof(config.autoBackup)} onChanged={delayedSaveConfig}/>
                    </FieldWrapper>
                </>
            }
        </form>
    )
}