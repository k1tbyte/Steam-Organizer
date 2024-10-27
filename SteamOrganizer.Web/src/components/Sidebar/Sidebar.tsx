import React, {
    createContext,
    type Dispatch,
    type FC, forwardRef,
    type ReactElement,
    type ReactNode,
    type SetStateAction,
    useContext,
    useRef,
    useState
} from 'react'
import {useSlider} from "@/hooks/useSlider.ts";
import useMediaQuery from "@/hooks/useMediaQuery.ts";
import { useLocation, useNavigate} from "react-router-dom";
import {Gradients} from "@/assets";
import { popup, Tooltip} from "@/components/primitives/Popup.tsx";
import {UserInfo} from "@/components/Sidebar/UserInfo.tsx";
import styles from "./Sidebar.module.pcss"


export const enum ESidebarState {
    Hidden,
    Partial,
    Full
}

interface ISidebarItemProps {
    icon: ReactElement
    text: string
    link:string
}

interface ISidebarProps {
    children: ReactNode
}

interface ISidebarState {
    state: ESidebarState,
    small: boolean
}

export let setState: Dispatch<SetStateAction<ESidebarState>>
const SidebarContext = createContext<ISidebarState>({ state: 0, small: false })
const mediaBreak = "(max-width: 1023px)"

const getState = () => (Number(localStorage.getItem("sidebar")) ?? ESidebarState.Full);

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
                 wrapIf={sidebar.state === ESidebarState.Partial}
                 {...popup.right}>
           <NavLink {...props}/>
        </Tooltip>
    );
}

export const Sidebar: FC<ISidebarProps> = ({children}) => {
    const [state, setSidebarState] = useState<ESidebarState>(
        window.matchMedia(mediaBreak).matches ? ESidebarState.Hidden : getState()
    )

    const prevState = useRef(state)

    setState = setSidebarState

    const isSmallScreen = useMediaQuery( {
        query: mediaBreak,
        callback: (match: boolean) => {
            setState(match ? ESidebarState.Hidden : getState());
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
            localStorage.setItem("sidebar", newState.toString())
        }
    });

    return (
        <aside className={styles.sidebar}>
            <nav className={`${styles.nav} ${state === ESidebarState.Full ? "w-52" : state == ESidebarState.Partial ? "w-16" : "w-0 overflow-clip"}`}>
                {!isSmallScreen && <div className={styles.navTopStub}/>}
                <SidebarContext.Provider value={ { state: state, small: isSmallScreen } }>
                    <ul className="flex-1">
                        {children}
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