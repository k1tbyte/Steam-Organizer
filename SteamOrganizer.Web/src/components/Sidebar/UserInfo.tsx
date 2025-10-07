import React, {type FC, useState} from "react";
import Button, {EButtonVariant} from "@/shared/ui/Button";
import {Icon, SvgIcon} from "src/defines";
import {useAuth} from "@/providers/authProvider";
import {Loader} from "@/shared/ui/Loader";
import {AnimatePresence, motion} from "framer-motion";
import styles from "./UserInfo.module.css"
import {ESidebarState} from "@/types/uiMetadata";
import {useIsOffline} from "@/store/local";
import {popupDefaults} from "@/shared/ui/Popup/Popup";
import {TooltipConditional} from "@/shared/ui/Popup/Tooltip";

export const UserInfo: FC<{state: ESidebarState}> = ({ state }) => {
    const {user, signIn, signOut } = useAuth()
    const [expanded, setExpand] = useState(false)
    const isOffline = useIsOffline()

    if(isOffline) {
        return;
    }

    if(!user.isLoggedIn) {
        return  (
            <div className={styles.login}>
                { user.isLoggedIn === undefined ?
                    <Loader className="w-full flex-center" size={30} /> :
                    <Button className={styles.googleLogin + " p-2"}
                            variant={EButtonVariant.Outlined} onClick={signIn}>
                        { state === ESidebarState.Full && "Login for sync" }
                        <SvgIcon className="shrink-0" icon={Icon.GoogleDrive} size={20}/>
                    </Button>
                }
            </div>
        )
    }

    const expand = () => setExpand(prev => !prev)

    return (
        <div className={styles.infoContainer}>
            <div className="flex">
                <img onClick={expand}
                    src="https://lh3.googleusercontent.com/-pWaHk_ARKUE/AAAAAAAAAAI/AAAAAAAAAAA/ALKGfkmGnG-ofqO7aT1eoG5axxiS-fCs9A/photo.jpg?sz=46" alt=""
                    className={styles.avatar}
                />
            {state === ESidebarState.Full &&
                <div className={styles.infoWrapper}>
                    <div className={styles.infoText}>
                        <h4 className={styles.name}>{user.name}</h4>
                        <span className={styles.email}>{user.email}</span>
                        <div className={styles.shadow}/>
                    </div>
                    <SvgIcon role="button" icon={Icon.ChevronDown} className={styles.expander +
                        (expanded ? "" : " rotate-90")} onClick={expand} size={15}
                    />
                </div>
            }
            </div>
            <AnimatePresence>
                {expanded &&
                    <motion.div initial={{height: 0}}
                                animate={{height: "auto"}}
                                transition={{delay: 0.05}}
                                exit={{height: 0}}>
                        <div className="pt-2 text-nowrap">
                            <TooltipConditional message={"Logout"}
                                     preventOpen={state !== ESidebarState.Partial}
                                {...popupDefaults.side}>
                                <Button className="py-2 px-0 rounded-md" variant={EButtonVariant.Transparent}
                                        onClick={signOut}>
                                    <SvgIcon className={styles.btnIcon} icon={Icon.Exit} size={23}/>
                                    {state === ESidebarState.Full && <span className="font-bold text-2xs">Logout</span>}
                                </Button>
                            </TooltipConditional>
                        </div>
                    </motion.div>
                }
            </AnimatePresence>
        </div>
    )
}