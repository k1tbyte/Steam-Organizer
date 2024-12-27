import React, {
    createContext,
    type Dispatch,
    type FC, forwardRef,
    type ReactElement,
    type SetStateAction,
    useContext,
    useRef,
    useState
} from 'react'
import {useSlider} from "@/shared/hooks/useSlider";
import useMediaQuery from "@/shared/hooks/useMediaQuery";
import { useLocation, useNavigate} from "react-router-dom";
import {Gradients, Icon, SvgIcon} from "src/defines";
import {UserInfo} from "@/components/Sidebar/UserInfo";
import styles from "./Sidebar.module.pcss"
import {ESidebarState} from "@/types/uiMetadata";
import {uiStore, useIsOffline} from "@/store/local";
import {Tooltip} from "@/shared/ui/Popup/Tooltip";
import { popupDefaults } from "@/shared/ui/Popup/Popup";

interface ISidebarItemProps {
    icon: ReactElement
    text: string
    link:string
}

interface ISidebarState {
    state: ESidebarState,
    small: boolean
}

export let setState: Dispatch<SetStateAction<ESidebarState>>
const SidebarContext = createContext<ISidebarState>({ state: ESidebarState.Full, small: false })
const mediaBreak = "(max-width: 1023px)"

const NavLink = forwardRef<HTMLDivElement, ISidebarItemProps>(({ link, icon, text, ...props }, ref) => {
    let location=useLocation();
    let navigate = useNavigate();
    const sidebar = useContext(SidebarContext)
    const isActive = location.pathname.startsWith(link)

    let containerCn: string;
    let activeCn: string;
    let textCn = sidebar.state != ESidebarState.Full ? " hidden" : "";

    if(isActive) {
        containerCn = " text-blue-400"
        activeCn = " scale-x-100 bg-accent border-l-[3px]"
        textCn += " text-foreground"
    }
    else {
        containerCn = " text-foreground-muted hover:bg-border"
        activeCn = " scale-x-0"
    }

    return (
        <div ref={ref} {...props} className={styles.navItem + containerCn} draggable={false} onClick={() => {
            if (sidebar.small) {
                setState(ESidebarState.Hidden)
            }
            if (location.pathname != link) {
                navigate(link);
            }
        }}>
            {isActive ? React.cloneElement(icon, {stroke: Gradients.LightBlue}) : icon}
            <p className={styles.navItemText + textCn}>{text}</p>
            <div className={styles.navItemOverlay + activeCn}/>
        </div>
    )
})

export const SidebarItem: FC<ISidebarItemProps> = (props) => {
    const sidebar = useContext(SidebarContext)

    return (
        <Tooltip message={props.text}
                 preventOpen={sidebar.state !== ESidebarState.Partial}
                 {...popupDefaults.side}>
           <NavLink {...props}/>
        </Tooltip>
    );
}

export const Sidebar: FC = () => {
    const isOffline = useIsOffline()
    const [state, setSidebarState] = useState<ESidebarState>(
        window.matchMedia(mediaBreak).matches ? ESidebarState.Hidden : uiStore.store.sidebarState
    )

    const prevState = useRef(state)

    setState = setSidebarState

    const isSmallScreen = useMediaQuery( {
        query: mediaBreak,
        callback: (match: boolean) => {
            setState(match ? ESidebarState.Hidden : uiStore.store.sidebarState);
        }
    });

    const sliderRef = useSlider((event: PointerEvent) => {
        let newState: ESidebarState | null = null;

        if(event.clientX < 30 && prevState.current != ESidebarState.Hidden) {
            newState = ESidebarState.Hidden
        }
        else if(event.clientX > 60 && event.clientX < 100 && prevState.current != ESidebarState.Partial) {
            newState = ESidebarState.Partial
        }
        else if(event.clientX > 165 && prevState.current != ESidebarState.Full) {
            newState = ESidebarState.Full
        }

        if(newState != null) {
            prevState.current = newState;
            setState(newState)
            uiStore.emit(nameof(uiStore.store.sidebarState), newState)
        }
    });

    return (
        <aside className={styles.sidebar}>
            <nav className={`${styles.nav} ${state === ESidebarState.Full ? "w-52" : state == ESidebarState.Partial ? "w-16" : "w-0 overflow-clip"}`}>
                {!isSmallScreen && <div className={styles.navTopStub}/>}
                <SidebarContext.Provider value={ { state: state, small: isSmallScreen } }>
                    <ul className="flex-1">
                        <SidebarItem icon={<SvgIcon icon={Icon.UsersOutline} size={20}/>} text="Accounts" link="/accounts"/>
                        <SidebarItem icon={<SvgIcon icon={Icon.LightningOutline} size={20}/>} text="Actions" link="/actions"/>
                        { !isOffline &&
                            <SidebarItem icon={<SvgIcon icon={Icon.FolderSync} size={20}/>} text={"Backups"} link="/backups"/>
                        }
                    </ul>
                </SidebarContext.Provider>
                <UserInfo state={state}/>
            </nav>

            <div ref={sliderRef} className={styles.expander}>
                <div className={styles.expanderGrip}/>
            </div>

            {state != ESidebarState.Hidden && isSmallScreen &&
                <div className={styles.navOverlay} onClick={() => setState(ESidebarState.Hidden)}></div>
            }
        </aside>
    )
}