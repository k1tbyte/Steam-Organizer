import React, {FC} from "react";
import {Icon, SvgIcon} from "@/defines";
import {delayedSaveAccounts} from "@/store/accounts";
import {ECredentialType} from "@/types/accountCredentials";
import {validators} from "@/shared/hooks/useFormValidation";
import {FieldWrapper, InputValidationWrapper} from "@/components/FieldWrapper";
import {PasswordBox} from "@/shared/ui/PasswordBox";
import Input, {EPropertyChangedTrigger, type IInputProps} from "@/shared/ui/Input";
import {CopyButton} from "@/shared/ui/CopyButton/CopyButton";
import {credentialFieldNames} from "./types";

interface ICredentialsFieldProps extends Omit<IInputProps, 'type'> {
    type: ECredentialType;
    readOnly?: boolean
}


export const CredentialField:FC<ICredentialsFieldProps> = ({ type, ...props }) => {

    let icon: Icon | undefined = undefined;
    props.maxLength = 50
    props.onChanged = delayedSaveAccounts

    switch (type) {
        case ECredentialType.Password:
            icon = Icon.Key;
            props.validator = validators.password
            break;
        case ECredentialType.Phone:
            icon = Icon.Phone;
            props.converter = Number
            props.validator = validators.phone
            props.filter = /[0-9]/
            props.maxLength = 15
            break;
        case ECredentialType.Email:
            icon = Icon.Email;
            props.validator = validators.email
            break;
    }

    const Wrapper = props.validator ? InputValidationWrapper : FieldWrapper;
    const FieldInput = type === ECredentialType.Password ? PasswordBox : Input;

    return (
        <Wrapper title={credentialFieldNames[type]} icon={<SvgIcon icon={icon ?? Icon.UserText} size={20}/>}>
            <>
                <FieldInput trigger={EPropertyChangedTrigger.OnLostFocus} {...props}/>
                <CopyButton style={{ width: "35px" }} className="ml-1" size={18} copyContent={() => props.bindTo[props.bindKey]}/>
            </>
        </Wrapper>
    )
}