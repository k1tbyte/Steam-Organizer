import type { Account } from "@/entity/account.ts";
import React, {FC } from "react";
import {Link} from "react-router-dom";
import {Icon, SvgIcon} from "@/assets";
import {accounts} from "@/store/accounts.ts";

interface IAccountCardProps {
    acc: Account,
}


const AccountCard: FC<IAccountCardProps> = ({acc} ) => {
  return (
      <div className="flex bg-primary  p-4 pr-10 rounded-[3px] h-fit relative">

          <img loading="lazy"
              src={acc.avatarHash ? `https://avatars.steamstatic.com/${acc.avatarHash}_medium.jpg` :
                  "https://ui-avatars.com/api/?background=c7d2fe&color=3730a3&bold=true"}
              alt=""
              className="rounded-lg grad-primary p-0.5 w-[55px] h-[55px] shrink-0"
          />

          <div className="ml-3">
              <div className="flex">
                  <span className="text-[14px]">{acc.nickname}</span>
                  <Link className="btn-rect ml-[6px]" to={`/accounts/${acc.login}`}>
                      <SvgIcon icon={Icon.EditSquare} size={14}/>
                  </Link>
                  <button className="btn-rect ml-2">
                      <SvgIcon icon={Icon.EnterSquare} size={14}/>
                  </button>
              </div>
              <div className="text-xs mt-[7px] flex flex-wrap font-bold text-background gap-[5px]">

                  <div className="flex text-nowrap gap-[5px] mr-2">
                      <div className="chip">Level: {acc.steamLevel ?? `—`}</div>
                      <div className="chip">Years: 4</div>
                  </div>

                  <div className="flex flex-wrap gap-[5px] text-[12px]">
                      {acc.vacBansCount && <div className="chip bg-close">VAC</div>}
                      {acc.gameBansCount && <div className="chip bg-close">Game</div>}
                      {acc.haveCommunityBan && <div className="chip bg-close">Community</div>}
                      {acc.economyBan && <div className="chip bg-close">Trade</div>}
                  </div>

                  <span className="text-foreground font-medium w-full"><b className="text-secondary">ID:</b> {acc.id?.toString()}</span>
              </div>
          </div>

          <SvgIcon icon={Icon.Pin} role="button" className="absolute text-foreground-muted right-3 top-3 hover:text-yellow-300 btn rotate-45" size={20}/>
          <SvgIcon icon={Icon.Trash} role="button" className="absolute text-foreground-muted right-3 bottom-3 hover:text-danger btn" size={20} onClick={() => {
              accounts.mutate((o) => {
                  o.splice(o.indexOf(acc), 1)
              })
          }}/>

      </div>

  )
}

export default React.memo(AccountCard)
