import React, {FC, useState} from "react";
import {ESidebarState} from "@/components/Sidebar/Sidebar.tsx";
import Button, {EButtonVariant} from "@/components/primitives/Button.tsx";
import {Icon, SvgIcon} from "@/assets";
import {useAuth} from "@/providers/authProvider.tsx";
import {Loader} from "@/components/primitives/Loader.tsx";
import {AnimatePresence, motion} from "framer-motion";
import {popup, Tooltip} from "@/components/primitives/Popup.tsx";
import styles from "./UserInfo.module.pcss"

interface IUserInfoProps {
    state: ESidebarState
}

export const UserInfo: FC<IUserInfoProps> = ({ state }) => {
    const {user, signIn, signOut } = useAuth()
    const [expanded, setExpand] = useState(false)

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
                            <Tooltip message={"Logout"}
                                     wrapIf={state === ESidebarState.Partial}
                                {...popup.right}>
                                <Button className="py-2 px-0 rounded-md" variant={EButtonVariant.Transparent}
                                        onClick={signOut}>
                                    <SvgIcon className={styles.btnIcon} icon={Icon.Exit} size={23}/>
                                    {state === ESidebarState.Full && <span className="font-bold text-2xs">Logout</span>}
                                </Button>
                            </Tooltip>
                        </div>
                    </motion.div>
                }
            </AnimatePresence>
        </div>
    )
}