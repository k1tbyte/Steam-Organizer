import React, {type FC, useRef, useState} from "react";
import {useParams} from "react-router-dom";
import {Tabs} from "@/shared/ui/Tabs";
import {Gradients, Icon, SvgIcon} from "src/defines";
import {motion} from "framer-motion";
import styles from "./Profile.module.css";
import {useScrollbar} from "@/shared/hooks/useScrollbar";
import {accounts, saveAccounts} from "@/store/accounts";
import { setDocumentTitle} from "@/shared/lib/utils";
import {type Account} from "@/entity/account";
import {useObservableLoader} from "@/shared/hooks/useObservableLoader";
import {LoaderStatic} from "@/shared/ui/Loader";
import SummariesTab from "./components/SummariesTab/SummariesTab";
import GamesTab from "./components/GamesTab/GamesTab";
import FriendsTab from "./components/FriendsTab/FriendsTab";
import {ESteamIdType, idConverters} from "@/shared/lib/steamIdConverter";
import Button, {EButtonVariant, type IButtonActions} from "@/shared/ui/Button";
import {steamBase} from "@/shared/api/steamApi";
import {flagStore, useFlagStore} from "@/store/local";
import {Tooltip} from "@/shared/ui/Popup/Tooltip";
import { popupDefaults } from "@/shared/ui/Popup/Popup";
import {RadioButton} from "@/shared/ui/RadioButton/RadioButton";
import {EPlacement} from "@/shared/ui/Popup/positioning";
import ProfileHeader from "@/pages/Profile/components/ProfileHeader/ProfileHeader";

export interface IAccountProps {
    acc: Account
}

const links = [
    "Profile", "Games", "Friends", "Inventory", "Badges", "Groups"
]

const tabs = [
    { title: "Profile", i: Icon.UserOutline },
    { title: "Games", i: Icon.Gamepad },
    { title: "Friends", i: Icon.Users }
]

export const Profile: FC = () => {
    let acc: Account | undefined;

    let [updated, setUpdate] = useState(false);
    const updateBtn = useRef<IButtonActions>();
    const {id} = useParams();
    const isLoading = useObservableLoader(accounts);
    const [isUpdating] = useFlagStore<boolean>(nameof(flagStore.store.isDbUpdating))
    const onScrollRef = useRef<() => void>();
    const {hostRef, scrollRef} = useScrollbar({
        scroll: () => onScrollRef.current?.()
    }, [isLoading]);

    if(isLoading) {
        return <LoaderStatic/>
    }

    const numId = parseFloat(id)
    acc = accounts.value.find(!isNaN(numId) ?
        (o => o.id === numId) : (o => o.login === id))
    setDocumentTitle(acc.nickname)

    if (!acc) {
        return <p>Account not found</p>
    }

    const onScrollInitialize = (onScroll: () => void) => {
        onScrollRef.current = onScroll
        return scrollRef.current
    }

    const tabNavigator =
        <RadioButton className={styles.tabsPanel} generator={tabs}
                     indicator={
                         <motion.div className={styles.tabsIndicator}
                                     layoutId="active-pill"
                                     transition={{type: "spring", duration: 1, x: {duration: 0.5}}}/>
                     }>
            {(item, _, isActive) => (
                <div className={styles.tabButton + (isActive ? " text-foreground-accent" : " text-foreground")}>
                    <SvgIcon icon={item.i} fill={isActive ? Gradients.LightBlue : null} size={20}/>
                    {item.title}
                </div>
            )}
        </RadioButton>

    return (
        <div className={styles.wrapper} ref={hostRef}>
            <div className={styles.mainContainer}>
                <ProfileHeader acc={acc}/>
                {acc.id ?
                    <>
                        <div className={styles.linksPanel}>
                            {links.map((link, i) => (
                                <button key={i} className={styles.linkButton} onClick={() => {
                                    open(`${steamBase}profiles/${idConverters[ESteamIdType.SteamID64].from(acc.id)}/${link.toLowerCase()}`, "_blank")
                                }}>
                                    {link}
                                </button>))
                            }
                        </div>
                        <Tabs virtual-wrapper="" navigator={tabNavigator}>
                            <SummariesTab acc={acc}/>
                            <GamesTab scroller={onScrollInitialize} acc={acc}/>
                            <FriendsTab/>
                        </Tabs>
                    </> :
                    <SummariesTab acc={acc}/>
                }

                {!updated && !acc.isUpToDate() && !isUpdating &&
                    <Tooltip {...popupDefaults.side} placement={EPlacement.Left} message="Update account info">
                        <Button actions={updateBtn} variant={EButtonVariant.Outlined}
                                className={`${styles.updateBtn} rounded-xl`}
                                onClick={async () => {
                                    updateBtn.current.setLoading(true)
                                    if (await acc.update()) {
                                        setUpdate(true)
                                        await saveAccounts()
                                        return;
                                    }
                                    updateBtn.current.setLoading(false)
                                }}>
                            <SvgIcon icon={Icon.SyncRenew} size={20}/>
                        </Button>
                    </Tooltip>
                }
            </div>
        </div>
    )
}