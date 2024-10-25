import React, {FC, ReactElement, useEffect} from "react";
import {useParams} from "react-router-dom";
import {Tab, TabPanel} from "@/components/primitives/Tabs.tsx";
import {Gradients, Icon, SvgIcon} from "@/assets";
import {motion} from "framer-motion";
import styles from "./Profile.module.pcss";
import ProfileTab from "@/pages/Profile/tabs/ProfileTab.tsx";
import GamesTab from "@/pages/Profile/tabs/GamesTab.tsx";
import FriendsTab from "@/pages/Profile/tabs/FriendsTab.tsx";
import {useScrollbar} from "@/hooks/useScrollbar.ts";
import {accounts} from "@/store/accounts.ts";
import {defaultAvatar} from "@/store/config.ts";
import {dateFormatter} from "@/lib/utils.ts";
import {Account} from "@/entity/account.ts";
import {useLoader} from "@/hooks/useLoader.ts";
import {Loader, LoaderStatic} from "@/components/primitives/Loader.tsx";

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
    return (
        <div className={styles.infoContainer}>
            <div className="text-center">
                <p className={styles.infoTitle}>Added</p>
                <p className={styles.infoSubtitle}>{
                    dateFormatter.format(acc.addedDate)
                }</p>
            </div>

            { acc.id &&
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
                </>
            }
        </div>
    )
}


export const Profile: FC = () => {
    const {id} = useParams();
    const isLoading = useLoader(accounts);
    const { hostRef} = useScrollbar(undefined, [isLoading]);

    if(isLoading) {
        return <LoaderStatic/>
    }

    const numId = parseFloat(id)
    const acc = accounts.value.find(!isNaN(numId) ?
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
                            } children={<ProfileTab acc={acc}/>}/>

                            <Tab key="games" title={(active) =>
                                <TabTitle title="Games" icon={<SvgIcon icon={Icon.Gamepad} size={20}/>}
                                          active={active}/>
                            } children={<GamesTab/>}/>

                            <Tab key="friends" title={(active) =>
                                <TabTitle title="Friends" icon={<SvgIcon icon={Icon.Users} size={20}/>}
                                          active={active}/>
                            } children={<FriendsTab/>}/>
                        </TabPanel>
                    </div> :
                    <ProfileTab acc={acc}/>
                }

            </div>
        </div>
    )
}