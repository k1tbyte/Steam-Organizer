import React, {FC, type ReactElement} from "react";
import {Icon, SvgIcon} from "@/defines";
import type {IAccountProps} from "@/pages/Profile/Profile.tsx";
import {dateFormatter} from "@/shared/lib/timeFormatting";
import clsx from "clsx";

interface IBadgeChipProps {
    name: string;
    badge: ReactElement;
    icon: Icon;
    description: ReactElement;
    className?: string;
}

const BadgeChip: FC<IBadgeChipProps> = ({name, icon, description, badge, className = ""}) => (
    <div className={clsx("flex flex-col justify-between grad-chip p-5 rounded-lg text-foreground m-5", className)}>
        <div className="flex-y-center gap-4">
            <SvgIcon icon={icon} size={45} className="text-secondary"/>
            <span className="font-bold letter-space">{name}</span>
        </div>
        <div className="flex items-end justify-between mt-8 gap-3 text-sm font-medium">
            {description}
            {badge}
        </div>
    </div>
)

const CommunityArea: FC<IAccountProps> = ({acc}) => {
    return (
        <div className="sm:grid" style={{gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))"}}>
            {acc.getYears() > 1 &&
                <BadgeChip
                    name="Years of service"
                    badge={<img className="opacity-85 rounded-lg"
                                src={`/yearBadge/year${Math.floor(acc.getYears())}.bmp`} alt=""/>}
                    icon={Icon.SteamOutline}
                    description={<p>
                        Account registered
                        <br/>
                        <span className="text-secondary"> {dateFormatter.format(acc.createdDate)} </span>
                    </p>}
                />
            }
            {acc.gamesCount > 0 &&
                <>
                    <BadgeChip
                        name="Game collection"
                        badge={<img className="opacity-85"
                                    src={`/gameBadge/${acc.gamesBadgeBoundary}.png`} alt=""/>}
                        icon={Icon.GameController}
                        description={<p>
                            Games on account
                            <br/>
                            <span className="text-secondary"> {acc.gamesCount} </span>

                            {acc.playedGamesCount > 0 &&
                                <>
                                    <br/>
                                    Of them played
                                    <br/>
                                    <span className="text-secondary">
                                    {acc.playedGamesCount} ({((acc.playedGamesCount / acc.gamesCount) * 100).toFixed(1)}%) {acc.hoursOnPlayed.toFixed(1)} h
                                </span>
                                </>
                            }
                        </p>}
                    />
                    {acc.paidGames > 0 &&
                        <BadgeChip name="Cost of games" className="col-span-2"
                                   badge={<p className="font-bold text-base grad-success rounded-md py-1 px-3 text-background">{acc.totalGamesPrice}</p>}
                                   icon={Icon.Sack}
                                   description={<p>Paid games: <span className="text-secondary">{acc.paidGames}</span></p>}
                        />
                    }
                </>
            }
        </div>)
}

export default CommunityArea;