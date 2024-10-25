import type { Account } from "@/entity/account.ts";
import React, {FC, useContext, useEffect, useRef} from "react";
import {Link} from "react-router-dom";
import { Icon, SvgIcon} from "@/assets";
import {accounts, delayedSaveAccounts, saveAccounts} from "@/store/accounts.ts";
import styles from "./AccountCard.module.pcss"
import {defaultAvatar} from "@/store/config.ts";
import {Tooltip} from "@/components/primitives/Popup.tsx";
import {dateFormatter} from "@/lib/utils.ts";
import {ConfirmPopup} from "@/components/elements/ConfirmPopup.tsx";
import {AccountsContext} from "@/pages/Accounts/elements/AccountsNav.tsx";
import {Draggable} from "@/components/primitives/Draggable.tsx";

interface IAccountCardProps {
    acc: Account,
    index: number,
}

const AccountCard: FC<IAccountCardProps> = ({acc, index} ) => {
    // @ts-ignore
    const bansCount = acc.haveCommunityBan + !!acc.vacBansCount + !!acc.gameBansCount +  !!acc.economyBan
    const context = useContext(AccountsContext)
    const gripRef = useRef<SVGSVGElement>(null)

    const onDrop = (i: number) => {
        accounts.mutate((o) => {
            const acc = o.splice(index, 1)[0]
            o.splice(i, 0, acc)
        })

        delayedSaveAccounts()
        return true
    }

    return <Draggable context={context}
                      gripRef={gripRef}
                      index={index}
                      hoverOnId={styles.cardAccent}
                      onDrop={onDrop}>
        <div className={styles.card}>
            <div className="shrink-0">
                <Tooltip message={() =>
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
                    {/* <SvgIcon icon={Icon.Lock} size={16} className="fill-success"/> */}
                    {!acc.id &&
                        <Tooltip
                            message={() => "This is an anonymous account and does not contain any\ninformation other than credentials"}>
                            <SvgIcon icon={Icon.Incognito} size={16} className="fill-yellow-300"/>
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

            {context.isEnabled ?
                <SvgIcon icon={Icon.DragZone}
                         ref={gripRef}
                         className={styles.grip}
                         size={25}/> :
                <SvgIcon icon={Icon.Pin} role="button"
                         className={styles.pin}
                         size={20}/>
            }

            <ConfirmPopup text={`Are you sure you want to delete '${acc.login}'?`} onYes={async () => {
                accounts.mutate((o) => {
                    o.splice(o.indexOf(acc), 1)
                })
                await saveAccounts()
            }}>
                <SvgIcon icon={Icon.Trash} role="button" className={styles.trashBin} size={20}/>
            </ConfirmPopup>
        </div>
    </Draggable>
}

export default React.memo(AccountCard)
