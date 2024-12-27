import type { Account } from "@/entity/account.ts";
import React, {type FC, useContext, useRef} from "react";
import {Link} from "react-router-dom";
import { Icon, SvgIcon} from "src/defines";
import {accounts, saveDbMutation} from "@/store/accounts";
import styles from "./AccountCard.module.css"
import {defaultAvatar} from "@/store/config";
import {Tooltip} from "@/shared/ui/Popup/Tooltip";
import {dateFormatter} from "@/shared/lib/utils";
import {ConfirmPopup} from "@/components/ConfirmPopup";
import {AccountsContext} from "@/pages/Accounts/components/AccountsNav";
import {Draggable} from "@/shared/ui/Draggable";
import {flagStore, useFlagStore} from "@/store/local";

interface IAccountCardProps {
    acc: Account,
    pinned: boolean;
    index: number,
}


const onDragOver = (from: number, to: number) => {
    return (accounts.value[from].unpinIndex === undefined) === (accounts.value[to].unpinIndex === undefined)
}

const onDrop = (from: number, to: number) => {
    saveDbMutation((o) => {
        const acc = o.splice(from, 1)[0]
        o.splice(to, 0, acc)
    })
    return true
}

const CardMain: FC<IAccountCardProps & { isEnabled: boolean, gripRef: React.MutableRefObject<SVGSVGElement> }> =
    ({acc, pinned, index, isEnabled, gripRef }) => {
    // @ts-ignore
    const bansCount = acc.haveCommunityBan + !!acc.vacBansCount + !!acc.gameBansCount + !!acc.economyBan
    const [isUpdating] = useFlagStore<boolean>(nameof(flagStore.store.isDbUpdating))

    const pinAccount = () => {
        acc.unpinIndex = index;

        if (index > 0 && accounts.value[index - 1].unpinIndex === undefined) {
            const targetIndex = accounts.value.findIndex((a, i) => i < index && a.unpinIndex === undefined);
            if (targetIndex !== -1) {
                acc.moveTo(index, targetIndex);
            }
        }
        saveDbMutation()
    }

    const unpinAccount = () => {
        const end = accounts.value.length - 1;
        let targetIndex = acc.unpinIndex > end ? end : acc.unpinIndex;
        if (index < end && accounts.value[index + 1].unpinIndex !== undefined) {
            const minIndex = accounts.value.findIndex(a => a.unpinIndex === undefined) - 1;
            targetIndex = (minIndex !== -1 && acc.unpinIndex <= minIndex) ? minIndex : acc.unpinIndex;
        }

        acc.moveTo(index, targetIndex);
        acc.unpinIndex = undefined;
        saveDbMutation()
    }

    return (
        <div className={`${styles.card} ${isEnabled && pinned ? styles.cardAccentPinned : ""}`}>
            <div className="shrink-0">
                <Tooltip canHover={true} message={() =>
                    <p>
                        Account added: {dateFormatter.format(acc.addedDate)}
                        {acc.lastUpdateDate && `\nAccount updated: ${dateFormatter.format(acc.lastUpdateDate)}`}
                    </p>
                }>
                    <img loading="lazy" decoding="async"
                         src={`https://avatars.steamstatic.com/${acc.avatarHash ?? defaultAvatar}_medium.jpg`}
                         alt="" draggable={false}
                         className={styles.avatar}
                    />
                </Tooltip>

                <div className={styles.indicators}>
                    {!acc.id &&
                        <Tooltip
                            message={() => "This is an anonymous account and does not contain any\ninformation other than credentials"}>
                            <SvgIcon icon={Icon.Incognito} size={16} className="fill-yellow-300"/>
                        </Tooltip>
                    }
                    { acc.authenticator &&
                        <Tooltip
                            message={() => "This account is 2FA protected\nClick to copy the code"}>
                            <SvgIcon icon={Icon.Lock} size={16}
                                     onClick={async () => navigator.clipboard.writeText(await acc.generate2faCode() ?? "")}
                                     className="fill-success cursor-pointer"/>
                        </Tooltip>
                    }
                </div>
            </div>

            <div className={styles.main}>
                <div className="flex">
                    <span className={styles.nick}>{acc.nickname}</span>
                    <Link className={styles.edit} to={`/accounts/${acc.id ?? acc.login}`} draggable={false}>
                        <SvgIcon icon={Icon.EditSquare} size={14}/>
                    </Link>
                    <button className={styles.enter}>
                        <SvgIcon icon={Icon.EnterSquare} size={14}/>
                    </button>
                </div>
                <div className={styles.body}>

                    <div className={styles.topInfo}>
                        <div className="chip">Level: {acc.steamLevel ?? '—'}</div>
                        <div className="chip">Years: {acc.getYears() ?? '—'}</div>
                    </div>

                    {bansCount ?
                        <div className={styles.bans}>
                            {bansCount > 2 && <span className={styles.banChip}>+{bansCount - 2}</span>}
                            {!!acc.vacBansCount && <div className={styles.banChip}>VAC</div>}
                            {!!acc.gameBansCount && <div className={styles.banChip}>Game</div>}
                            {!!acc.haveCommunityBan && <div className={styles.banChip}>Community</div>}
                            {!!acc.economyBan && <div className={styles.banChip}>Trade</div>}
                        </div> :
                        <div className="h-[20px]">
                            <div className={styles.anyBans}>No bans &#10003;</div>
                        </div>
                    }

                    <p className={styles.id}><b
                        className="text-secondary">ID:</b> {acc.id ?? '—'}</p>
                </div>
            </div>

            {isEnabled ?
                <SvgIcon icon={Icon.DragZone}
                         ref={gripRef}
                         className={styles.grip}
                         size={25}/> :
                <SvgIcon icon={Icon.Pin} role="button"
                         onClick={pinned ? unpinAccount : pinAccount}
                         className={`${styles.pin} ${pinned ? "text-warn" : "rotate-45"}`}
                         size={20}/>
            }

            {!isUpdating &&
                <ConfirmPopup text={`Are you sure you want to delete '${acc.login}'?`} onYes={() => {
                    saveDbMutation((o) => {
                        o.splice(o.indexOf(acc), 1)
                    })
                }}>
                    <SvgIcon icon={Icon.Trash} role="button" className={styles.trashBin} size={20}/>
                </ConfirmPopup>
            }
        </div>
    )
}

const AccountCard: FC<IAccountCardProps> = ({acc, pinned, index}) => {
    const context = useContext(AccountsContext)
    const gripRef = useRef<SVGSVGElement>(null)

    return <Draggable context={context}
                      gripRef={gripRef}
                      index={index}
                      hoverStyleId={styles.cardAccent}
                      onOver={onDragOver}
                      onDrop={onDrop}>
        <CardMain acc={acc} pinned={pinned} index={index} isEnabled={context.isEnabled} gripRef={gripRef}/>
    </Draggable>
}

export default React.memo(AccountCard)
