import React, {type FC, useEffect, useRef, useState} from "react";
import {useParams} from "react-router-dom";
import { Tabs } from "@/shared/ui/Tabs.tsx";
import {Gradients, Icon, SvgIcon} from "src/defines";
import {motion} from "framer-motion";
import styles from "./Profile.module.css";
import {useScrollbar} from "@/shared/hooks/useScrollbar.ts";
import {accounts, saveAccounts} from "@/store/accounts.ts";
import {defaultAvatar} from "@/store/config.ts";
import {dateFormatter, setDocumentTitle} from "@/shared/lib/utils.ts";
import {type Account} from "@/entity/account.ts";
import {useLoader} from "@/shared/hooks/useLoader.ts";
import {LoaderStatic} from "@/shared/ui/Loader.tsx";
import SummariesTab from "./SummariesTab";
import GamesTab from "./GamesTab/GamesTab.tsx";
import FriendsTab from "./FriendsTab";
import {ComboBox} from "@/shared/ui/ComboBox/ComboBox.tsx";
import {converters, ESteamIdType} from "@/shared/lib/steamIdConverter.ts";
import Button, {EButtonVariant, IButtonActions} from "@/shared/ui/Button.tsx";
import {steamBase} from "@/shared/api/steamApi.ts";
import {EVisibilityState} from "@/types/steamPlayerSummary.ts";
import {flagStore, uiStore, useFlagStore} from "@/store/local.tsx";
import {EPlacementX} from "@/shared/ui/Popup/positioning.ts";
import {Tooltip} from "@/shared/ui/Popup/Tooltip.tsx";
import {popupDefaults} from "@/shared/ui/Popup/Popup.tsx";
import {RadioButton} from "@/shared/ui/RadioButton/RadioButton.tsx";

export interface IAccountProps {
    acc: Account
}

const links = [
    "Profile", "Games", "Friends", "Inventory", "Badges", "Groups"
]

const tabs = [
    { title: "Profile", i: Icon.UserOutline },
    { title: "Games", i: Icon.Gamepad },
    { title: "Friends", i: Icon.Users }
]

const Info: FC<IAccountProps> = ({ acc }) => {
    const idRef = useRef<HTMLParagraphElement>(null)
    const idTooltipRef = useRef<HTMLDivElement>(null)
    const idType = ["Account ID", "Steam ID", "Steam2 ID", "Steam3 ID", "CS2 Friend code", "Steam3 Hex"];
    if(acc.vanityUrl) {
        idType.push("Vanity URL")
    }

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
                        <ComboBox style={{ height: "30px"}} selectedIndex={uiStore.store.displayingId}
                                  items={idType} onSelected={(i) => {
                            if(acc.vanityUrl && i === idType.length - 1) {
                                idRef.current.textContent = acc.vanityUrl
                                return
                            }
                            uiStore.emit(nameof(uiStore.store.displayingId), i)
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
    const [isUpdating] = useFlagStore<boolean>(nameof(flagStore.store.isDbUpdating))
    useEffect(() => setDocumentTitle(acc?.nickname), [isLoading]);
    const onScrollRef = useRef<() => void>();
    const { hostRef, scrollRef } = useScrollbar({
        scroll: () => onScrollRef.current?.()
    }, [isLoading]);

    if(isLoading) {
        return <LoaderStatic/>
    }

    const numId = parseFloat(id)
    acc = accounts.value.find(!isNaN(numId) ?
        (o => o.id === numId) : (o => o.login === id))

    if (!acc) {
        return <p>Account not found</p>
    }

    const onScrollInitialize = (onScroll: () => void) => {
        onScrollRef.current = onScroll
        return scrollRef.current
    }


    const isPublic = acc.visibilityState === EVisibilityState.Public
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
                    <div>
                        <p className={styles.nicknameTitle}>{acc.nickname}
                            {acc.id &&
                                <Tooltip message={`Steam profile is ${isPublic ? "public" : "private"}`}>
                                    <SvgIcon className={`inline ml-2 ${isPublic ? "fill-success" : "fill-warn"}`}
                                             icon={isPublic ? Icon.Eye : Icon.EyeOff}
                                             size={14}/>
                                </Tooltip>
                            }

                        </p>

                    </div>
                    <div className="w-full bg-background my-5 h-0.5"/>
                    <Info acc={acc}/>
                </div>
                {acc.id ?
                    <>
                        <div className={styles.linksPanel}>
                            {links.map((link, i) => (
                                <button key={i} className={styles.linkButton} onClick={() => {
                                    open(`${steamBase}profiles/${converters[ESteamIdType.SteamID64].from(acc.id)}/${link.toLowerCase()}`, "_blank")
                                }}>
                                    {link}
                                </button>))
                            }
                        </div>
                        <Tabs virtual-wrapper="" navigator={
                            <RadioButton indicator={
                                <motion.div className={styles.tabsIndicator}
                                            layoutId="active-pill"
                                            transition={{type: "spring", duration: 1, x: {duration: 0.5}}}/>
                            }
                                         className={styles.tabsPanel} generator={tabs}>
                                {(item, _, isActive) => (
                                    <div className={styles.tabButton + (isActive ? " text-foreground-accent" : " text-foreground")}>
                                        <SvgIcon icon={item.i} fill={isActive ? Gradients.LightBlue : null} size={20}/>
                                        {item.title}
                                    </div>
                                )}
                            </RadioButton>}
                        >
                            <SummariesTab acc={acc}/>
                            <GamesTab scroller={onScrollInitialize} acc={acc}/>
                            <FriendsTab/>
                        </Tabs>
                    </> :
                    <SummariesTab acc={acc}/>
                }

                {!updated && !acc.isUpToDate() && !isUpdating &&
                    <Tooltip {...popupDefaults.side} alignX={EPlacementX.Left} message="Update account info">
                        <Button actions={updateBtn} variant={EButtonVariant.Outlined}
                                className="absolute right-3 top-5 h-10 z-10 rounded-xl"
                                onClick={async () => {
                                    updateBtn.current.setLoading(true)
                                    if (await acc.update()) {
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