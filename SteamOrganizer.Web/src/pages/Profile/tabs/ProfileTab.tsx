import {FC, ReactElement} from "react";
import {Expander} from "@/components/primitives/Expander.tsx";
import {Gradients, Icon, SvgIcon} from "@/assets";
import { Account } from "@/entity/account.ts";
import { type IAccountProps} from "@/pages/Profile/Profile.tsx";
import {dateFormatter} from "@/lib/utils.ts";

interface IBanChipProps {
    name: string;
    banDescription?: string;
}

interface IBadgeChipProps {
    name: string;
    badge: ReactElement;
    icon: Icon;
    description: ReactElement;
}

const BanChip: FC<IBanChipProps> = ({ name, banDescription }) => (
    <div className="grad-chip px-4 py-4 text-sm  rounded-lg flex-y-center flex-wrap justify-between">
        <span className="font-bold letter-space">{name}</span>
        { banDescription ?
            <>
                <SvgIcon className="text-danger" icon={Icon.AlertDecagram} size={32}/>
                <p className="w-full text-xs text-close mr-10">{banDescription}</p>
            </>
            : <SvgIcon fill={Gradients.Success} icon={Icon.CheckDecagram} size={32}/>
        }
    </div>
)

const BadgeChip: FC<IBadgeChipProps> = ({name, icon, description, badge}) => (
    <div className="flex flex-col justify-between grad-chip p-5 rounded-lg text-foreground m-5">
        <div className="flex-y-center gap-4">
            <SvgIcon icon={icon} size={45} className="text-secondary"/>
            <span className="font-bold letter-space">{name}</span>
        </div>
        <div className="flex items-end justify-between mt-8 gap-3">
            {description}
            {badge}
        </div>
    </div>
)

const CredentialsArea: FC<IAccountProps> = ({ acc }) => {
    return (
        <Expander className="backdrop-primary mt-3" icon={<SvgIcon icon={Icon.Fingerprint} size={28}/>} title="Credentials">
            <div className="p-4">
                <p>Content</p>
                <p>Content</p>
                <p>Content</p>
            </div>
        </Expander>
    )
}

const ProfileTab: FC<IAccountProps> = ({ acc }) => {

    if(!acc.id) {
        return <CredentialsArea acc={acc}/>
    }

    return (
        <div className="flex flex-col md:grid grid-cols-3 gap-3">
            <div className="row-span-2 col-span-2">
                <Expander className="backdrop-primary "
                          icon={<SvgIcon icon={Icon.BadgeAward} size={24}/>} title="Community">
                    <div className=" sm:grid" style={{gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))"}}>
                        { acc.getYears() > 1 &&
                            <BadgeChip
                                name="Years of service"
                                badge={<img className="opacity-85 rounded-lg"
                                            src={`/yearBadge/year${Math.floor(acc.getYears())}.bmp`} alt=""/>}
                                icon={Icon.SteamOutline}
                                description={<p className="text-sm font-medium">
                                    Account registered
                                    <br/>
                                    <span className="text-secondary"> {dateFormatter.format(acc.createdDate)} </span>
                                </p>}
                            />
                        }

                        <BadgeChip
                            name="Game collection"
                            badge={<img className="opacity-85"
                                        src="/gameBadge/100.png" alt="100"/>}
                            icon={Icon.GameController}
                            description={<p className="text-sm font-medium">
                                Games on account
                                <br/>
                                <span className="text-secondary"> 128 </span>
                                <br/>
                                Of them played
                                <br/>
                                <span className="text-secondary"> 64 (50.0%) 12,851 h </span>
                            </p>}
                        />
                    </div>
                </Expander>
                <CredentialsArea acc={acc}/>
            </div>

            <Expander className="backdrop-primary" icon={<SvgIcon icon={Icon.Block} size={24}/>} title="Bans">
                <div className="p-4 space-y-5">
                    <BanChip name="VAC ban"/>
                    <BanChip name="Game ban"
                             banDescription="Bans received in several games: Counter Strike 2, Naraka Bladepoint, Narrow arrow, Team Fortress 2"/>
                    <BanChip name="Community ban"/>
                    <BanChip name="Trade ban"/>
                </div>
            </Expander>
        </div>
    );
}

export default ProfileTab;