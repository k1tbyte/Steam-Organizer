import React, {type FC, type ReactElement} from "react";
import {Expander} from "@/components/primitives/Expander.tsx";
import {Gradients, Icon, SvgIcon} from "@/assets";
import {type IAccountProps} from "@/pages/Profile/Profile.tsx";
import {dateFormatter} from "@/lib/utils.ts";
import {FieldWrapper, InputValidationWrapper} from "@/components/elements/FieldWrapper.tsx";
import Input from "@/components/primitives/Input.tsx";
import {PasswordBox} from "@/components/primitives/PasswordBox.tsx";
import {TextArea} from "@/components/primitives/TextArea.tsx";
import {  EEconomyBanType } from "@/types/steamPlayerSummary.ts";
import {validators} from "@/hooks/useFormValidation.ts";
import {delayedSaveAccounts} from "@/store/accounts.ts";
import { RadioButtonGroup} from "@/components/primitives/RadioButton.tsx";
import {Tooltip} from "@/components/primitives/Popup.tsx";
import {ECredentialType, serviceNames} from "@/types/accountCredentials.ts";
import {modal} from "@/components/primitives/Modal.tsx";

interface IBanChipProps {
    name: string;
    banDescription?: string;
    banned?: boolean | number;
}

interface IBadgeChipProps {
    name: string;
    badge: ReactElement;
    icon: Icon;
    description: ReactElement;
}

interface ICredentialsFieldProps {
    type: ECredentialType;
    bindTo: object;
    bindKey: string;
    readOnly?: boolean
}

const CredentialsField:FC<ICredentialsFieldProps> = ({ type, ...props }) => {

    let input: ReactElement | undefined;
    let title: string;
    let icon: Icon | undefined = undefined;
    let withWrapper: boolean;
    const inputProps = { ...props/*, onChanged: delayedSaveAccounts */}

    switch (type) {
        case ECredentialType.Password:
            title = "Password";
            icon = Icon.Key;
            withWrapper = true
            input = <PasswordBox  maxLength={50}
                                  validator={validators.password} {...inputProps}/>
            break;
        case ECredentialType.Phone:
            withWrapper = true
            title = "Phone number"
            icon = Icon.Phone;
            input = <Input maxLength={15}
                           converter={Number}
                           validator={validators.phone}
                           filter={/[0-9]/} {...inputProps}/>
            break;
        case ECredentialType.Email:
            title = "Email";
            icon = Icon.Email;
            break;
        case ECredentialType.Login:
            title = "Login";
            break;
        case ECredentialType.SecretWord:
            title = "Secret word";
            break;
    }

    icon = icon ?? Icon.UserText;
    return (
        withWrapper ?
            <InputValidationWrapper title={title} icon={<SvgIcon icon={icon} size={20}/>}>
                {input}
            </InputValidationWrapper>
            : <FieldWrapper title={title} icon={<SvgIcon icon={icon} size={20}/>}>
                {input ?? <Input {...inputProps}/>}
            </FieldWrapper>

    )
}

const CredentialsButton: FC<{icon: Icon, title: string, shift?: boolean, onClick?: () => void}> =
    React.memo(({icon, title, onClick, shift = false}) =>
    {
        return (
            <Tooltip message={title} >
                <SvgIcon className={`p-1.5 ${shift ? "-ml-4" : ""}`} role="button" onClick={onClick} icon={icon} size={38}/>
            </Tooltip>
        )
    })


const CredentialsArea: FC<IAccountProps> = ({ acc }) => {
    const [active, setActive] = React.useState(0);
    const credential = acc.credentials?.[active - 1];
    const field = credential?.f;

    return (
        <Expander className="backdrop-primary" icon={<SvgIcon
            icon={Icon.Fingerprint} size={28}/>}
                  title={
                    <span>
                        Credentials
                        <small className="text-secondary">
                            {`${active === 0 ? " (Steam)" : ( credential ? ` (${(credential.n ?? serviceNames[credential.i])})` : "")}`}
                        </small>
                    </span>
                  }>

            <div className="p-4 max-w-80 ml-0 md:ml-3">

                <div className="flex gap-3 flex-wrap justify-center md:justify-normal mb-3">
                    <RadioButtonGroup activeIndex={active} setActive={setActive}>
                        <CredentialsButton icon={Icon.Steam} title={"Steam"}/>
                        { acc.credentials &&
                            {...acc.credentials.map(o => {
                                return <CredentialsButton icon={o.i} title={o.n ?? serviceNames[o.i]}/>
                            })}
                        }
                    </RadioButtonGroup>
                    <CredentialsButton icon={Icon.Plus} title="Add"
                                       onClick={() => {
                                           modal.open({
                                               title: "Add new credentials",
                                               body: "This feature is not implemented yet."
                                           })
                                       }}
                                       shift={true}/>
                </div>

                    {active === 0 ?
                        <>
                            <CredentialsField type={ECredentialType.Login} bindTo={acc} bindKey={nameof(acc.login)}
                                              readOnly/>
                            <CredentialsField type={ECredentialType.Password} bindTo={acc}
                                              bindKey={nameof(acc.password)}/>
                            <CredentialsField type={ECredentialType.Phone} bindTo={acc} bindKey={nameof(acc.phone)}/>
                        </> :
                        <>
                            {
                                Object.entries(field).map(([key]) => {
                                    return <CredentialsField key={field[key]} type={Number(key)} bindTo={field}
                                                             bindKey={key}/>
                                })
                            }
                        </>
                    }
            </div>
        </Expander>
    )
}


const BanChip: FC<IBanChipProps> = ({name, banned, banDescription}) => (
    <div className="grad-chip px-4 py-4 text-sm  rounded-lg flex-y-center flex-wrap justify-between">
        <span className="font-bold letter-space">{name}</span>
        {(banned) ?
            <>
                <SvgIcon className="text-danger" icon={Icon.AlertDecagram} size={32}/>
                <p className="w-full text-xs text-close mr-10">{banDescription}</p>
            </>
            : <SvgIcon fill={Gradients.Success} icon={Icon.CheckDecagram} size={32}/>
        }
    </div>
)

const BadgeChip: FC<IBadgeChipProps> = ({name, icon, description, badge}) => (
    <div className="flex flex-col justify-between grad-chip p-5 rounded-lg text-foreground m-5">
        <div className="flex-y-center gap-4">
            <SvgIcon icon={icon} size={45} className="text-secondary"/>
            <span className="font-bold letter-space">{name}</span>
        </div>
        <div className="flex items-end justify-between mt-8 gap-3">
            {description}
            {badge}
        </div>
    </div>
)

const CommunityArea: FC<IAccountProps> = ({ acc }) => {
    return (
        <div className="sm:grid" style={{gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))"}}>
        {acc.getYears() > 1 &&
            <BadgeChip
                name="Years of service"
                badge={<img className="opacity-85 rounded-lg"
                            src={`/yearBadge/year${Math.floor(acc.getYears())}.bmp`} alt=""/>}
                icon={Icon.SteamOutline}
                description={<p className="text-sm font-medium">
                    Account registered
                    <br/>
                    <span className="text-secondary"> {dateFormatter.format(acc.createdDate)} </span>
                </p>}
            />
        }
        {acc.gamesCount > 0 &&
            <BadgeChip
                name="Game collection"
                badge={<img className="opacity-85"
                            src={`/gameBadge/${acc.gamesBadgeBoundary}.png`} alt=""/>}
                icon={Icon.GameController}
                description={<p className="text-sm font-medium">
                    Games on account
                    <br/>
                    <span className="text-secondary"> {acc.gamesCount} </span>

                    { acc.playedGamesCount > 0 &&
                        <>
                            <br/>
                            Of them played
                            <br/>
                            <span className="text-secondary">
                                {acc.playedGamesCount} ({((acc.playedGamesCount / acc.gamesCount) * 100).toFixed(1)}%) {acc.hoursOnPlayed.toFixed(1)} h
                            </span>
                        </>
                    }
                </p>}
            />
        }
        </div>)
}

const ProfileTab: FC<IAccountProps> = ({acc}) => {

    const noteArea = <Expander className="backdrop-primary w-full md:order-none self-start"
                               icon={<SvgIcon icon={Icon.NoteEdit} size={24}/>} title="Note about account">
    <div className="p-4">
            <TextArea className="grad-chip rounded-xl resize-none"
                      onInput={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                          acc.note = e.target.value
                          delayedSaveAccounts();
                      }}
                      defaultValue={acc.note}
                      autoResize={true} maxRows={10} rows={5} maxLength={200}
                      placeholder="Some information about the account . . ."/>
        </div>
    </Expander>

    if (!acc.id) {
        return (
            <div className="grid md:grid-cols-2 gap-3 mt-3">
                <CredentialsArea acc={acc}/>
                {noteArea}
            </div>
        )
    }

    return (
        <div className="flex flex-col md:grid grid-cols-3 gap-3 ">
            <div className="row-span-2 col-span-2 order-last md:order-none">
                {
                    (acc.getYears() > 0 || acc.gamesCount) &&
                    <Expander className="backdrop-primary mb-3"
                              icon={<SvgIcon icon={Icon.BadgeAward} size={24}/>} title="Community">
                        <CommunityArea acc={acc}/>
                    </Expander>
                }
                <CredentialsArea acc={acc}/>
            </div>

            <Expander className="backdrop-primary" icon={<SvgIcon icon={Icon.Block} size={24}/>} title="Bans">
                <div className="p-4 space-y-5">
                    <BanChip name="VAC ban" banned={acc.vacBansCount}
                             banDescription={`This account has been banned by VAC${
                                 (acc.vacBansCount > 1 ? ` in several games (${acc.vacBansCount})` : "")}`}/>
                    <BanChip name="Game ban" banned={acc.gameBansCount}
                             banDescription={`This account has a game ban${
                                 (acc.gameBansCount > 1 ? ` in several games (${acc.gameBansCount})` : "")
                             }`}/>
                    <BanChip name="Community ban" banned={acc.haveCommunityBan}
                             banDescription="The account is not allowed to interact with the Steam community."/>
                    <BanChip name="Trade ban" banned={acc.economyBan}
                             banDescription={`${(acc.economyBan === EEconomyBanType.Probation ?
                                     "The account is temporarily blocked." : "The account is permanently blocked."
                             )} Trade/exchange/sending of gifts is prohibited on this account`}/>
                </div>
            </Expander>

            <div className="row-span-2 order-last">
                {noteArea}
            </div>
        </div>
    );
}

export default ProfileTab;