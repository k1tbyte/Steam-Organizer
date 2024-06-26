import React, {FC, ReactElement } from "react";
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

interface ITabTitleProps {
    active: boolean;
    icon: ReactElement;
    title: string
}

const dateOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
} satisfies Intl.DateTimeFormatOptions;

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


export const Profile: FC = () => {
    const { id } = useParams();
    const numId = parseFloat(id)
    const acc = accounts.data.find(!isNaN(numId) ?
        (o => o.id === numId) : (o => o.login === id))
    const { hostRef } = useScrollbar();

    if(!acc) {
        return <p>Account not found</p>
    }

    const dateFormat = new Intl.DateTimeFormat(navigator.language, dateOptions);
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
                            17
                        </div>
                    </div>
                    <p className={styles.nicknameTitle}>{acc.nickname}</p>
                    <div className="w-full bg-background my-5 h-0.5"/>
                    <div className={styles.infoContainer}>
                        <div className="text-center">
                            <p className={styles.infoTitle}>Added</p>
                            <p className={styles.infoSubtitle}>{
                                dateFormat.format(new Date(acc.addedDate))
                            }</p>
                        </div>

                        <div className="text-center">
                            <p className={styles.infoTitle}>Updated</p>
                            <p className={styles.infoSubtitle}>{
                                acc.lastUpdateDate ? dateFormat.format(new Date(acc.lastUpdateDate)) : '—'
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
                    </div>
                </div>

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
                            <TabTitle title="Profile" icon={<SvgIcon icon={Icon.UserOutline} size={20}/>} active={active}/>
                        } children={<ProfileTab/>}/>

                        <Tab key="games" title={(active) =>
                            <TabTitle title="Games" icon={<SvgIcon icon={Icon.Gamepad} size={20}/>} active={active}/>
                        } children={<GamesTab/>}/>

                        <Tab key="friends" title={(active) =>
                            <TabTitle title="Friends" icon={<SvgIcon icon={Icon.Users} size={20}/>} active={active}/>
                        } children={<FriendsTab/>}/>
                    </TabPanel>
                </div>
            </div>
        </div>
    )
}