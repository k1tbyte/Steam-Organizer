import {FC} from "react";
import {Expander} from "@/components/primitives/Expander.tsx";
import {Gradients, Icon, SvgIcon} from "@/assets";

const ProfileTab: FC = () => (
    <div className="flex flex-col md:grid grid-cols-3 gap-3">
        <div className="row-span-2 col-span-2">
            <Expander className="backdrop-primary "
                      icon={<SvgIcon icon={Icon.BadgeAward} size={24}/>} title="Community">
                <div className=" sm:grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))"}}>
                    <div className="flex flex-col justify-between grad-chip p-5 rounded-lg text-foreground m-5">
                        <div className="flex-y-center gap-4">
                            <SvgIcon icon={Icon.SteamOutline} size={45} className="text-secondary"/>
                            <span className="font-bold letter-space">Years of service</span>
                        </div>
                        <div className="flex items-end justify-between mt-8 gap-3">
                            <p className="text-sm font-medium">
                                Account registered
                                <br/>
                                <span className="text-secondary"> 12.11.2013 18:22 </span>
                            </p>
                                <img className="opacity-85 rounded-lg"
                                     src="/yearBadge/year19.bmp" alt="100"/>
                        </div>
                    </div>
                    <div className="flex flex-col justify-between grad-chip p-5 rounded-lg text-foreground m-5">
                        <div className="flex-y-center gap-4">
                            <SvgIcon icon={Icon.GameController} size={45} className="text-secondary"/>
                            <span className="font-bold letter-space">Game collection</span>
                        </div>
                        <div className="flex items-end justify-between mt-8 gap-3">
                            <p className="text-sm font-medium">
                                Games on account
                                <br/>
                                <span className="text-secondary"> 128 </span>
                                <br/>
                                Of them played
                                <br/>
                                <span className="text-secondary"> 64 (50.0%) 12,851 h </span>
                            </p>
                            <img className="opacity-85"
                                 src="/gameBadge/100.png" alt="100"/>
                        </div>
                    </div>
                </div>
            </Expander>
            <Expander className="backdrop-primary mt-3" icon={<SvgIcon icon={Icon.Fingerprint} size={28}/>} title="Credentials">
                <div className="p-4">
                    <p>Content</p>
                    <p>Content</p>
                    <p>Content</p>
                </div>
            </Expander>
        </div>

        <Expander className="backdrop-primary" icon={<SvgIcon icon={Icon.Block} size={24}/>} title="Bans">
            <div className="p-4 space-y-5">
                <div className="grad-chip px-4 py-4 text-sm  rounded-lg flex-y-center justify-between">
                    <span className="font-bold letter-space">VAC ban</span>
                    <SvgIcon fill={Gradients.Success} icon={Icon.CheckDecagram} size={32}/>
                </div>

                <div className="grad-chip px-4 py-4 text-sm  rounded-lg flex-y-center justify-between">
                    <span className="font-bold letter-space">Game ban</span>
                    <SvgIcon fill={Gradients.Success} icon={Icon.CheckDecagram} size={32}/>
                </div>

                <div className="grad-chip px-4 py-4 text-sm  rounded-lg flex-y-center justify-between">
                    <span className="font-bold letter-space">Community ban</span>
                    <SvgIcon className="fill-close" fill={Gradients.Success} icon={Icon.AlertDecagram} size={32}/>
                </div>

                <div className="grad-chip px-4 py-4 text-sm  rounded-lg flex-y-center justify-between">
                    <span className="font-bold letter-space">Trade ban</span>
                    <SvgIcon fill={Gradients.Success} icon={Icon.CheckDecagram} size={32}/>
                </div>
            </div>
        </Expander>
    </div>
)

export default ProfileTab;