import Input, { EPropertyChangedTrigger, type IInputProps} from "@/shared/ui/Input";
import {ECredentialType, type IAccountCredential, serviceNames} from "@/types/accountCredentials";
import React, {type FC, useEffect} from "react";
import {Icon, SvgIcon} from "src/defines";
import {delayedSaveAccounts, saveAccounts} from "@/store/accounts";
import {validators} from "@/shared/hooks/useFormValidation";
import {FieldWrapper, InputValidationWrapper} from "@/components/FieldWrapper";
import {modal, ModalSeparator, useModalActions} from "@/shared/ui/Modal";
import {ComboBox} from "@/shared/ui/ComboBox/ComboBox";
import Button, {EButtonVariant} from "@/shared/ui/Button";
import type {IAccountProps} from "@/pages/Profile/Profile";
import {Expander, withStateSaving} from "@/shared/ui/Expander";
import {ConfirmPopup} from "@/components/ConfirmPopup";
import {PasswordBox} from "@/shared/ui/PasswordBox";
import {uiStore} from "@/store/local";
import {Tooltip} from "@/shared/ui/Popup/Tooltip";
import {RadioButton} from "@/shared/ui/RadioButton/RadioButton";
import {Tabs} from "@/shared/ui/Tabs";

interface ICredentialsFieldProps extends Omit<IInputProps, 'type'> {
    type: ECredentialType;
    readOnly?: boolean
}

const NewCredentialsModal: FC<{onAdd: (value: IAccountCredential) => void}> = ({ onAdd }) => {
    const [fields, setFields] = React.useState<ECredentialType[]>([]);
    const items = fieldNames.filter((_,i) => !fields.includes(i))
    const objRef = React.useRef<IAccountCredential>({f: {}});
    const { contentRef, closeModal } = useModalActions<HTMLDivElement>();

    return (
        <div ref={contentRef} style={{ width: "270px"}}>
            <FieldWrapper className="mb-3" title="Display name"
                          icon={<SvgIcon icon={Icon.InfoCircleOutline} size={20}/>}>
                <Input placeholder="Leave blank to use default"
                       maxLength={20}
                       bindTo={objRef.current}
                       bindKey={nameof(objRef.current.n)}/>
            </FieldWrapper>
            <ComboBox allowClear placeholder="External link type (Other)"
                      items={Object.entries(serviceNames).map(([k, v], i) => {
                          return <div key={i} className="flex-y-center gap-3">
                              <SvgIcon icon={Number(k)} size={20}/>
                              {v}
                          </div>
                      })}
                      onSelected={o => {
                          objRef.current.i = o
                      }}
            />
            <ModalSeparator className="my-4"/>
            {
                fields.map((f, i) => {
                    return <div className="flex items-center" key={i}>
                        <CredentialsField readOnly
                                          validator={null}
                                          className="pointer-events-none"
                                          type={f}/>
                        <Button variant={EButtonVariant.Outlined}
                                onClick={() => {
                                    setFields(prev => prev.filter((_, j) => j !== i))
                                }}
                                className="py-1 px-2 mt-4 ml-4">
                            —
                        </Button>
                    </div>
                })
            }
            {
                items.length > 0 &&
                <ComboBox placeholder="Select type of credential"
                          className="mt-3"
                          items={items}
                          onSelected={(i) => {
                              setFields(prev =>
                                  [...prev, fieldNames.indexOf(items[i])]
                              );
                              return true
                          }}/>
            }

            {
                fields.length > 0 &&
                <Button className="mt-5 mx-auto" children="Submit" onClick={() => {
                    objRef.current.f = fields.reduce((acc, index) => {
                        acc[index.toString()] = "";
                        return acc;
                    }, {} as Record<ECredentialType, string>)

                    if(objRef.current.n === "") {
                        delete objRef.current.n;
                    }

                    if(objRef.current.i >= 0) {
                        objRef.current.i = Number(Object.keys(serviceNames)[objRef.current.i]);
                    } else {
                        delete objRef.current.i;
                    }

                    onAdd(objRef.current);
                    closeModal()
                }}/>
            }
        </div>
    )
}

const fieldNames = ["Login", "Email", "Password", "Secret word", "Phone"];
const CredentialsField:FC<ICredentialsFieldProps> = ({ type, ...props }) => {

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
        <Wrapper title={fieldNames[type]} icon={<SvgIcon icon={icon ?? Icon.UserText} size={20}/>}>
            <FieldInput trigger={EPropertyChangedTrigger.OnLostFocus} {...props}/>
        </Wrapper>
    )
}

const CredentialsButton: FC<{icon: Icon, title: string, shift?: boolean}> = ({icon, title, shift}) => {
    return (
        <Tooltip message={title}>
            <SvgIcon className={`p-1.5 ${shift ? "-ml-1.5" : ""}`} role="button" icon={icon} size={38}/>
        </Tooltip>
    )
}


const CredentialsArea: FC<IAccountProps> = ({acc}) => {
    const items = [null, ...acc.credentials, null];
    const subtitleRef = React.useRef<HTMLElement>(null);

    const setSubtitle = (active: number) => {
        const credential = acc.credentials?.[active - 1];
        subtitleRef.current.innerText = active === 0 ? " (Steam)" :
             credential ? ` (${(credential.n ?? credential.i ? serviceNames[credential.i] : "Other")})` : "";
    }

    useEffect(() => {
        setSubtitle(0);
    }, []);

    const navigator = <RadioButton className="flex gap-3 flex-wrap justify-center md:justify-normal mb-3"
                                   clickInterceptor={(i, setActive) => {
                                       if(i !== items.length - 1) {
                                           return;
                                       }

                                       modal.open({
                                           title: "Add linked account",
                                           body: <NewCredentialsModal onAdd={async (o) => {
                                               acc.credentials = acc.credentials ?? [];
                                               acc.credentials.push(o);
                                               items.splice(items.length - 1, 0, o);
                                               setActive(acc.credentials.length);
                                               await saveAccounts()
                                           }}/>
                                       })

                                       return true;
                                   }}
                                   indicator={null} generator={items}>
        {(item, index, isActive) => {

            if (index === items.length - 1) {
                return (!acc.credentials || items.length < 9) && <CredentialsButton shift={true} icon={Icon.Plus} title="Add"/>
            }

            return <div
                className={`rounded transition-transform cursor-pointer hover:scale-110 ${isActive ? "bg-chip text-foreground-accent" : "grad-chip text-foreground"}`}>
                <CredentialsButton icon={item ? item.i ?? Icon.CardText : Icon.Steam}
                                   title={item ? item.n ?? serviceNames[item.i] : "Steam"}/>
            </div>
        }}
    </RadioButton>

    return (
        <Expander className="backdrop-primary" {...withStateSaving(nameof(uiStore.store.credentials))}
                  icon={<SvgIcon icon={Icon.Fingerprint} size={28}/>}
                  title={
                      <span>
                        Credentials
                        <small ref={subtitleRef} className="text-secondary"/>
                    </span>
                  }>

            <div className="p-4 ml-0 md:ml-3" style={{maxWidth: "350px"}}>
                <Tabs navigator={navigator} onStateChanged={setSubtitle}>
                    {(index, setActive) => {
                        const field = acc.credentials?.[index - 1]?.f;
                        return index === 0 ?
                            <>
                                <CredentialsField type={ECredentialType.Login} bindTo={acc} bindKey={nameof(acc.login)}
                                                  readOnly/>
                                <CredentialsField type={ECredentialType.Password} bindTo={acc}
                                                  bindKey={nameof(acc.password)}/>
                                <CredentialsField type={ECredentialType.Phone} bindTo={acc}
                                                  bindKey={nameof(acc.phone)}/>
                            </> :
                            <>
                                {
                                    // We need rerender every time when field changes, so we use random key
                                    Object.entries(field).map(([key]) => {
                                        return <CredentialsField key={Math.random()} type={Number(key)} bindTo={field}
                                                                 bindKey={key}/>
                                    })
                                }
                                <div className="w-full flex justify-end">
                                    <ConfirmPopup text={`Delete this credentials?`} onYes={async () => {
                                        acc.credentials.splice(index - 1, 1);
                                        items.splice(index, 1);
                                        setActive(index - 1);
                                        await saveAccounts()
                                    }}>
                                        <Button variant={EButtonVariant.Primary} className="mt-4 bg-danger min-w-24">
                                            Delete
                                        </Button>
                                    </ConfirmPopup>
                                </div>
                            </>
                    }}
                </Tabs>

            </div>
        </Expander>
    )
}

export default CredentialsArea;