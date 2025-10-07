import React, { useRef } from "react";
import {ESteamIdType, idConverters} from "@/shared/lib/steamIdConverter";
import {Icon, SvgIcon} from "@/defines";
import {ComboBox} from "@/shared/ui/ComboBox/ComboBox";
import {uiStore} from "@/store/local";
import {CopyButton} from "@/shared/ui/CopyButton/CopyButton";
import { type AccountComponent } from "@/pages/Profile/types";
import styles from "./ProfileHeader.module.css";
import {Tooltip} from "@/shared/ui/Popup/Tooltip";
import {defaultAvatar} from "@/store/config";
import {EVisibilityState} from "@/types/steamPlayerSummary";
import {dateFormatter} from "@/shared/lib/timeFormatting";

const steamIdTypes = ["Account ID", "Steam ID", "Steam2 ID", "Steam3 ID", "CS2 Friend code", "Steam3 Hex"];

const ProfileHeader: AccountComponent  = ({ acc }) => {
    const idRef = useRef<HTMLParagraphElement>(null)
    const id64 = acc.id ? idConverters[ESteamIdType.SteamID64].from(acc.id) : null
    const ids = acc.vanityUrl ? [...steamIdTypes, "Vanity URL"] : steamIdTypes
    const isPublic = acc.visibilityState === EVisibilityState.Public

    return (
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
            <div className={styles.separator}/>
            <div className={styles.infoContainer}>
                <div className="text-center">
                    <p className={styles.infoTitle}>Added</p>
                    <p className={styles.infoSubtitle}>{
                        dateFormatter.format(acc.addedDate)
                    }</p>
                </div>

                {acc.id > 0 &&
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
                            <a className={styles.iconLink} href={`https://steamcommunity.com/profiles/${id64}`}
                               target="_blank">
                                <SvgIcon icon={Icon.Steam} size={30}/>
                            </a>
                            <a className={styles.iconLink} href={`https://steamdb.info/calculator/${id64}`}
                               target="_blank">
                                <SvgIcon icon={Icon.SteamDb} size={30}/>
                            </a>
                        </div>

                        <div style={{width: "150px"}}>
                            <ComboBox style={{height: "30px"}} selectedIndex={uiStore.store.displayingId}
                                      items={ids} onSelected={(i) => {
                                if (acc.vanityUrl && i === ids.length - 1) {
                                    idRef.current.textContent = acc.vanityUrl
                                    return
                                }
                                uiStore.emit(nameof(uiStore.store.displayingId), i)
                                idRef.current.textContent = idConverters[i].from(acc.id)
                            }}/>
                            <b className="flex-center mt-2 gap-2">
                                <p ref={idRef} className="text-center text-secondary text-xs cursor-pointer">
                                    {acc.id}
                                </p>
                                <CopyButton copyContent={() => idRef.current.textContent}/>
                            </b>
                        </div>
                    </>
                }
            </div>
        </div>
    )
}

export default ProfileHeader;