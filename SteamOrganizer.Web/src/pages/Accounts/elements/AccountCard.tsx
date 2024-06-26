import type { Account } from "@/entity/account.ts";
import React, {FC } from "react";
import {Link} from "react-router-dom";
import { Icon, SvgIcon} from "@/assets";
import {accounts} from "@/store/accounts.ts";
import styles from "./AccountCard.module.pcss"
import {defaultAvatar} from "@/store/config.ts";

interface IAccountCardProps {
    acc: Account,
}

const AccountCard: FC<IAccountCardProps> = ({acc} ) => {
    // @ts-ignore
    const bansCount = acc.haveCommunityBan + !!acc.vacBansCount + !!acc.gameBansCount +  !!acc.economyBan

    return (
        <div className={styles.card}>

            <div className="shrink-0">
                <img loading="lazy"
                     src={`https://avatars.steamstatic.com/${acc.avatarHash ?? defaultAvatar}_medium.jpg`}
                     alt=""
                     className={styles.avatar}
                />
                <div className={styles.indicators}>
                    {/* <SvgIcon icon={Icon.Lock} size={16} className="fill-success"/> */}
                    { !acc.id && <SvgIcon icon={Icon.Incognito} size={16} className="fill-yellow-300"/>}
                </div>
            </div>

            <div className={styles.main}>
                <div className="flex">
                    <span className={styles.nick}>{acc.nickname}</span>
                    <Link className={styles.edit} to={`/accounts/${acc.id ?? acc.login}`}>
                        <SvgIcon icon={Icon.EditSquare} size={14}/>
                    </Link>
                    <button className={styles.enter}>
                        <SvgIcon icon={Icon.EnterSquare} size={14}/>
                    </button>
                </div>
                <div className={styles.body}>

                    <div className={styles.topInfo}>
                        <div className="chip">Level: {acc.steamLevel ?? `—`}</div>
                        <div className="chip">Years: {acc.getYears() ?? '—'}</div>
                    </div>

                    {bansCount ?
                        <div className={styles.bans}>
                            {bansCount > 2 && <span className={styles.banChip}>+{bansCount-2}</span>}
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

            <SvgIcon icon={Icon.Pin} role="button"
                     className={styles.pin}
                     size={20}/>
            <SvgIcon icon={Icon.Trash} role="button"
                     className={styles.trashBin} size={20}
                     onClick={() => {
                         accounts.mutate((o) => {
                             o.splice(o.indexOf(acc), 1)
                         })
                     }}/>
        </div>
    )
}

export default React.memo(AccountCard)
