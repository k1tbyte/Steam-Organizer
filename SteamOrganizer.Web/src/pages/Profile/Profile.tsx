import {FC} from "react";
import {useParams} from "react-router-dom";
import { FaSteamSymbol } from "react-icons/fa";
import { SiSteamdb } from "react-icons/si";
import { FaCheckCircle } from "react-icons/fa";
import { FaChevronDown } from "react-icons/fa";
import { MdBlock } from "react-icons/md";

export const Profile: FC = () => {
    const { id } = useParams();
    return (
        <div className="m-2.5 flex flex-1 gap-2.5 items-start justify-center mt-10">
            <div className="flex flex-col justify-center w-[1000px]">
                <div className="rounded-[25px] w-[98%] h-[190px] sm:h-[250px] relative overflow-clip mx-auto">
                    <img src="https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/items/601220/5b6469b419ece1d0b98f91a4d7293d58803df0f1.jpg"
                        className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 scale-125 object-cover object-center" alt=""/>
                    {/*                    <video playsInline autoPlay muted loop
                           className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 scale-125">
                        <source src="https://cdn.akamai.steamstatic.com/steamcommunity/public/images/items/292030/ef8800d4202871c5986baf5f49264897c5cffecd.mp4" type="video/mp4"/>
                    </video>*/}
                </div>
                <div className="bg-primary/80 z-10 -mt-16 h-[130px] w-full rounded-[32px] backdrop-saturate-150 backdrop-blur-md flex flex-col justify-center items-center border-t-[6px] border-tertiary/50">
                    <div className="mx-auto absolute -top-28 h-[175px] w-[184px] rounded-full scale-75">
                        <img style={{
                            maskImage: "url(#mask)"
                        }}
                             src="https://avatars.akamai.steamstatic.com/b3bd9dfc77bc5e2c12f6317873a12f0d36b4a65a_full.jpg"
                             className="absolute h-[175px] w-[184px]"
                             alt=""/>

                        <svg xmlns="http://www.w3.org/2000/svg" className="absolute stroke-accent"
                             viewBox="-3 -3 194 184" width="188" height="178"
                             strokeOpacity={0.6} strokeWidth={10}>

                            <path className="st0"
                                  d="M152.18,175H31.1c-12.92,0-23.4-11.34-23.4-25.32L-0.19,26.68C-0.19,11.94,11.29,0,25.46,0h132.71c14.16,0,25.64,11.94,25.64,26.68l-8.24,123.01C175.58,163.66,165.1,175,152.18,175z"
                                  fill="transparent"/>
                        </svg>
                        <div className="absolute py-1.5 rounded-md bottom-0 translate-y-1/3 left-1/2
                          -translate-x-1/2 px-5 font-code bg-background/50 text-center font-bold backdrop-blur-lg
                          text-teal-400 text-xl">
                            17
                        </div>
                    </div>
                    <p className="mt-4 text-lg letter-space font-bold text-foreground-accent absolute">SteamNickname</p>
                    <div className="w-full flex justify-between px-10">
                        <div className="flex items-center gap-10">
                            <div className="flex flex-col gap-4 items-center justify-center">
                                <p className="text-sm text-foreground letter-space">Added</p>
                                <p className="text-xs text-secondary font-bold">23.11.2020 11:35</p>
                            </div>
                            <div className="border-l-2 h-full border-tertiary/50"/>
                            <div className="flex flex-col gap-4 items-center justify-center">
                                <p className="text-sm text-foreground letter-space">Updated</p>
                                <p className="text-xs text-secondary font-bold">23.11.2020 11:35</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-5">
                            <div className="flex items-center gap-5">
                                <FaCheckCircle className="text-green-400" size={20}/>
                                <p className="text-foreground letter-space text-sm">No bans</p>
                            </div>

                            <div className="border-l-2 h-full border-tertiary/50 mx-5"/>
                            <div className="bg-[#1f232e] rounded-2xm flex items-center justify-center w-12 h-12">
                                <FaSteamSymbol size={30}/>
                            </div>
                            <div className="bg-[#1f232e] rounded-2xm flex items-center justify-center w-12 h-12">
                                <SiSteamdb size={30}/>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 mt-5 gap-5">
                    <div className="bg-primary/80 backdrop-saturate-150 backdrop-blur-md w-full rounded-lg text-foreground">
                        <div className="border-b-4 border-background p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 grad-chip rounded-xl flex items-center justify-center">
                                    <MdBlock size={24}/>
                                </div>
                                <p className="letter-space text-md font-bold inline">Bans</p>
                            </div>
                            <FaChevronDown size={22}/>
                        </div>
                        <div className="p-4 text-sm">

                        </div>
                    </div>

                    <div className="bg-primary/80 backdrop-saturate-150 backdrop-blur-md w-full rounded-lg p-5">
                        s
                    </div>
                </div>
            </div>
        </div>
    )
}