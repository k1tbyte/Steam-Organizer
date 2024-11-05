import React, {type FC, type ReactElement, useEffect, useRef, useState} from "react";
import {useParams} from "react-router-dom";
import {Tab, TabPanel} from "@/components/primitives/Tabs.tsx";
import {Gradients, Icon, SvgIcon} from "@/assets";
import {motion} from "framer-motion";
import styles from "./Profile.module.pcss";
import {useScrollbar} from "@/hooks/useScrollbar.ts";
import {accounts, saveAccounts} from "@/store/accounts.ts";
import {defaultAvatar} from "@/store/config.ts";
import {dateFormatter, setDocumentTitle} from "@/lib/utils.ts";
import {type Account} from "@/entity/account.ts";
import {useLoader} from "@/hooks/useLoader.ts";
import {LoaderStatic} from "@/components/primitives/Loader.tsx";
import SummariesTab from "./SummariesTab";
import GamesTab from "./GamesTab";
import FriendsTab from "./FriendsTab";
import {ComboBox} from "@/components/primitives/ComboBox/ComboBox.tsx";
import {converters} from "@/lib/steamIdConverter.ts";
import {EPlacementX, popup, Tooltip} from "@/components/primitives/Popup.tsx";
import {localProps, saveLocalProps} from "@/store/local.ts";
import Button, {EButtonVariant, IButtonActions} from "@/components/primitives/Button.tsx";

interface ITabTitleProps {
    active: boolean;
    icon: ReactElement;
    title: string
}

export interface IAccountProps {
    acc: Account
}

const TabTitle: FC<ITabTitleProps> = ( { active, icon, title }) => (
    <div className="flex-center gap-3">
        {
            active ? (
                <>
                    {React.cloneElement(icon, { fill: Gradients.LightBlue })}
                    <span className="test">{title}</span>
                </>
            ) : (
                <> {icon} {title} </>
            )
        }
    </div>
)

const Info: FC<IAccountProps> = ({ acc }) => {
    const idRef = useRef<HTMLParagraphElement>(null)
    const idTooltipRef = useRef<HTMLDivElement>(null)

    return (
        <div className={styles.infoContainer}>
            <div className="text-center">
                <p className={styles.infoTitle}>Added</p>
                <p className={styles.infoSubtitle}>{
                    dateFormatter.format(acc.addedDate)
                }</p>
            </div>

            { acc.id > 0 &&
                <>
                    <div className="text-center">
                        <p className={styles.infoTitle}>Updated</p>
                        <p className={styles.infoSubtitle}>{
                            acc.lastUpdateDate ? dateFormatter.format(acc.lastUpdateDate) : '—'
                        }</p>
                    </div>

                    <div className="flex-y-center gap-5">
                        <SvgIcon icon={Icon.CheckCircle} className="text-green-400" size={25}/>
                        <p className="letter-space text-sm">No bans</p>
                    </div>

                    <div className="flex gap-3">
                        <a className={styles.iconLink}>
                            <SvgIcon icon={Icon.Steam} size={30}/>
                        </a>
                        <a className={styles.iconLink}>
                            <SvgIcon icon={Icon.SteamDb} size={30}/>
                        </a>
                    </div>

                    <div style={{width: "150px"}}>
                        <ComboBox style={{ height: "30px"}} selectedIndex={localProps.displayingId}
                                  items={["Account ID", "Steam ID", "Steam2 ID", "Steam3 ID", "CS2 Friend code", "Steam3 Hex"]} onSelected={(i) => {
                                      saveLocalProps(localProps.displayingId = i)
                                      idRef.current.textContent = converters[i].from(acc.id)
                        }}/>
                        <Tooltip ref={idTooltipRef} message="Click to copy" openDelay={0}>
                            <b>
                                <p ref={idRef} className="text-center text-secondary text-xs mt-2 cursor-pointer"
                                   onClick={async () => {
                                       await navigator.clipboard.writeText(idRef.current.textContent)
                                       if (idTooltipRef.current) {
                                           idTooltipRef.current.textContent = "Copied"
                                       }
                                   }}>
                                    {acc.id}
                                </p>
                            </b>
                        </Tooltip>
                    </div>

                </>
            }
        </div>
    )
}


export const Profile: FC = () => {
    let acc: Account | undefined;

    let [updated, setUpdate] = useState(false);
    const updateBtn = useRef<IButtonActions>();
    const {id} = useParams();
    const isLoading = useLoader(accounts);
    const {hostRef} = useScrollbar(undefined, [isLoading]);
    useEffect(() => setDocumentTitle(acc?.nickname), [isLoading]);

    if(isLoading) {
        return <LoaderStatic/>
    }

    const numId = parseFloat(id)
    acc = accounts.value.find(!isNaN(numId) ?
        (o => o.id === numId) : (o => o.login === id))

    if (!acc) {
        return <p>Account not found</p>
    }


    return (
        <div className={styles.wrapper} ref={hostRef}>
            <div className={styles.mainContainer}>
                <div className={styles.header}>
                    <div className={styles.avatarContainer}>
                        <img style={{maskImage: "url(#avatarMask)"}}
                             decoding="async" draggable={false}
                             loading={"lazy"}
                             src={`https://avatars.akamai.steamstatic.com/${acc.avatarHash ?? defaultAvatar}_full.jpg`}
                             className={styles.avatar} alt="avatar"/>

                        <svg xmlns="http://www.w3.org/2000/svg" className="absolute stroke-accent"
                             viewBox="-3 -3 190 190" width="184" height="182" fill="transparent"
                             strokeOpacity={0.6} strokeWidth={10}>
                            <use xlinkHref={`/sprites.svg#avatarMask`}/>
                        </svg>
                        <div className={styles.lvlLabel}>
                            {acc.steamLevel ?? '—'}
                        </div>
                    </div>
                    <p className={styles.nicknameTitle}>{acc.nickname}</p>
                    <div className="w-full bg-background my-5 h-0.5"/>
                    <Info acc={acc}/>
                </div>

                {acc.id ?
                    <div className="mt-5 gap-5">
                        <TabPanel className="backdrop-primary flex-col sm:flex-row letter-space font-bold mb-5 py-3"
                                  activeKey="profile"
                                  indicator={
                                      <motion.div className={styles.tabsIndicator}
                                                  layoutId="active-pill"
                                                  transition={{type: "spring", duration: 1, x: {duration: 0.5}}}/>
                                  }
                        >
                            <Tab key="profile" title={(active) =>
                                <TabTitle title="Profile" icon={<SvgIcon icon={Icon.UserOutline} size={20}/>}
                                          active={active}/>
                            } children={<SummariesTab acc={acc}/>}/>

                            <Tab key="games" title={(active) =>
                                <TabTitle title="Games" icon={<SvgIcon icon={Icon.Gamepad} size={20}/>}
                                          active={active}/>
                            } children={<GamesTab acc={acc}/>}/>

                            <Tab key="friends" title={(active) =>
                                <TabTitle title="Friends" icon={<SvgIcon icon={Icon.Users} size={20}/>}
                                          active={active}/>
                            } children={<FriendsTab/>}/>
                        </TabPanel>
                    </div> :
                    <SummariesTab acc={acc}/>
                }

                {  !updated && !acc.isUpToDate() &&
                    <Tooltip {...popup.side} alignX={EPlacementX.Left} message="Update account info" >
                        <Button actions={updateBtn} variant={EButtonVariant.Outlined} className="absolute right-3 top-5 h-10 z-10 rounded-xl"
                                onClick={async () => {
                                    updateBtn.current.setLoading(true)
                                    if(await acc.update()) {
                                        setUpdate(true)
                                        await saveAccounts()
                                        return;
                                    }
                                    updateBtn.current.setLoading(false)
                                }}>
                            <SvgIcon icon={Icon.SyncRenew} size={20}/>
                        </Button>
                    </Tooltip>
                }
            </div>
        </div>
    )
}