import React, {FC, ReactElement } from "react";
import {useParams} from "react-router-dom";
import { SiSteamdb } from "react-icons/si";
import { FaCheckCircle, FaRegUserCircle, FaSteamSymbol, FaGamepad, FaUserFriends } from "react-icons/fa";
import {Tab, TabPanel} from "@/components/primitives/Tabs.tsx";
import {Gradients} from "@/assets";
import {motion} from "framer-motion";
import styles from "./Profile.module.pcss";
import ProfileTab from "@/pages/Profile/tabs/ProfileTab.tsx";
import GamesTab from "@/pages/Profile/tabs/GamesTab.tsx";
import FriendsTab from "@/pages/Profile/tabs/FriendsTab.tsx";
import {useScrollbar} from "@/hooks/useScrollbar.ts";

interface ITabTitleProps {
    active: boolean;
    icon: ReactElement;
    title: string
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


export const Profile: FC = () => {
    const { id } = useParams();
    const { hostRef } = useScrollbar();

    return (
        <div className={styles.wrapper} ref={hostRef}>
            <div className={styles.mainContainer}>
                <div className={styles.profileImgContainer}>
                    <img src="https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/items/601220/5b6469b419ece1d0b98f91a4d7293d58803df0f1.jpg"
                         className={styles.profileImg} alt=""/>
                    {/*                    <video playsInline autoPlay muted loop
                           className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 scale-125">
                        <source src="https://cdn.akamai.steamstatic.com/steamcommunity/public/images/items/292030/ef8800d4202871c5986baf5f49264897c5cffecd.mp4" type="video/mp4"/>
                    </video>*/}
                </div>
                <div className={styles.header}>
                    <div className={styles.avatarContainer}>
                        <img style={{maskImage: "url(#mask)"}}
                             src="https://avatars.akamai.steamstatic.com/b3bd9dfc77bc5e2c12f6317873a12f0d36b4a65a_full.jpg"
                             className={styles.avatar} alt="avatar"/>

                        <svg xmlns="http://www.w3.org/2000/svg" className="absolute stroke-accent"
                             viewBox="-3 -3 190 190" width="184" height="182"
                             strokeOpacity={0.6} strokeWidth={10}>
                            <path className="st0"
                                  d="M152.18,175H31.1c-12.92,0-23.4-11.34-23.4-25.32L-0.19,26.68C-0.19,11.94,11.29,0,25.46,0h132.71c14.16,0,25.64,11.94,25.64,26.68l-8.24,123.01C175.58,163.66,165.1,175,152.18,175z"
                                  fill="transparent"/>
                        </svg>
                        <div className={styles.lvlLabel}>
                            17
                        </div>
                    </div>
                    <p className={styles.nicknameTitle}>The old man from the mountain</p>
                    <div className="w-full bg-background my-5 h-0.5"/>
                    <div className={styles.infoContainer}>
                        <div className="text-center">
                            <p className={styles.infoTitle}>Added</p>
                            <p className={styles.infoSubtitle}>23.11.2020 11:35</p>
                        </div>

                        <div className="text-center">
                            <p className={styles.infoTitle}>Updated</p>
                            <p className={styles.infoSubtitle}>23.11.2020 11:35</p>
                        </div>

                        <div className="flex-y-center gap-5">
                            <FaCheckCircle className="text-green-400" size={20}/>
                            <p className="letter-space text-sm">No bans</p>
                        </div>

                        <div className="flex gap-3">
                            <a className={styles.iconLink}>
                                <FaSteamSymbol size={30}/>
                            </a>
                            <a className={styles.iconLink}>
                                <SiSteamdb size={30}/>
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
                            <TabTitle title="Profile" icon={<FaRegUserCircle size={20}/>} active={active}/>
                        } children={<ProfileTab/>}/>

                        <Tab key="games" title={(active) =>
                            <TabTitle title="Games" icon={<FaGamepad size={20}/>} active={active}/>
                        } children={<GamesTab/>}/>

                        <Tab key="friends" title={(active) =>
                            <TabTitle title="Friends" icon={<FaUserFriends size={20}/>} active={active}/>
                        } children={<FriendsTab/>}/>
                    </TabPanel>
                </div>
            </div>
        </div>
    )
}