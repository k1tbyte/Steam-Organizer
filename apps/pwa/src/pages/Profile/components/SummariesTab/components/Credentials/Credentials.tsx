import {ECredentialType, serviceNames} from "@/types/accountCredentials";
import React, {type FC, useEffect} from "react";
import {Icon, SvgIcon} from "@/defines";
import {saveAccounts} from "@/store/accounts";
import {modal} from "@/shared/ui/Modal";
import Button, {EButtonVariant} from "@/shared/ui/Button";
import type {IAccountProps} from "@/pages/Profile/Profile";
import {Expander, withStateSaving} from "@/shared/ui/Expander";
import {ConfirmPopup} from "@/components/ConfirmPopup";
import {uiStore} from "@/store/local";
import {Tooltip} from "@/shared/ui/Popup/Tooltip";
import {RadioButton} from "@/shared/ui/RadioButton/RadioButton";
import {Tabs} from "@/shared/ui/Tabs";
import {CredentialField} from "./CredentialField";
import {NewCredentialModal} from "./NewCredentialModal";
import styles from "./Credentials.module.css"


const CredentialButton: FC<{ icon: Icon, title: string, shift?: boolean }> = ({icon, title, shift}) => {
    return (
        <Tooltip message={title}>
            <SvgIcon className={`p-1.5 ${shift ? "-ml-1.5" : ""}`} role="button" icon={icon} size={38}/>
        </Tooltip>
    )
}

const Credentials: FC<IAccountProps> = ({acc}) => {
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

    const onNavigatorClick = (i, setActive) => {
        if (i !== items.length - 1) {
            return;
        }

        modal.open({
            title: "Add linked account",
            body: <NewCredentialModal onAdd={async (o) => {
                acc.credentials = acc.credentials ?? [];
                acc.credentials.push(o);
                items.splice(items.length - 1, 0, o);
                setActive(acc.credentials.length);
                await saveAccounts()
            }}/>
        })

        return true;
    }

    const navigator = <RadioButton className={styles.radioBtn}
                                   clickInterceptor={onNavigatorClick}
                                   indicator={null} generator={items}>
        {(item, index, isActive) => {

            if (index === items.length - 1) {
                return (!acc.credentials || items.length < 9) &&
                    <CredentialButton shift={true} icon={Icon.Plus} title="Add"/>
            }

            return <div
                className={`${styles.radioContent} ${isActive ? "bg-chip text-foreground-accent" : "grad-chip text-foreground"}`}>
                <CredentialButton icon={item ? item.i ?? Icon.CardText : Icon.Steam}
                                  title={item ? item.n ?? serviceNames[item.i] : "Steam"}/>
            </div>
        }}
    </RadioButton>

    return (
        <Expander className="backdrop-primary flex-1" {...withStateSaving(nameof(uiStore.store.credentials))}
                  icon={<SvgIcon icon={Icon.Fingerprint} size={28}/>}
                  title={
                      <span>
                        Credentials
                        <small ref={subtitleRef} className="text-secondary"/>
                    </span>
                  }>

            <div className="p-4 ml-0 md:ml-3" style={{minWidth: "300px"}}>
                <Tabs navigator={navigator} onStateChanged={setSubtitle}>
                    {(index, setActive) => {
                        const field = acc.credentials?.[index - 1]?.f;
                        return index === 0 ?
                            <>
                                <CredentialField type={ECredentialType.Login} bindTo={acc} bindKey={nameof(acc.login)}
                                                 readOnly/>
                                <CredentialField type={ECredentialType.Password} bindTo={acc}
                                                 bindKey={nameof(acc.password)}/>
                                <CredentialField type={ECredentialType.Phone} bindTo={acc}
                                                 bindKey={nameof(acc.phone)}/>
                            </> :
                            <>
                                {
                                    // We need rerender every time when field changes, so we use random key
                                    Object.entries(field).map(([key]) => {
                                        return <CredentialField key={Math.random()} type={Number(key)} bindTo={field}
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

export default Credentials;