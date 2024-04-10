import {FC, ReactNode, useRef} from 'react'
import {useSlider} from "../hooks/useSlider.ts";
import {useSelector} from "react-redux";
import {RootState} from "../store/store.ts";
import {useActions} from "../hooks/useActions.ts";
import {ESidebarState} from "../store/ui.slice.ts";
import useMediaQuery from "../hooks/useMediaQuery.ts";
import {Link, useLocation} from "react-router-dom";

interface ISidebarItemProps {
    icon: ReactNode
    text: string
    link:string
}
interface ISidebarProps {
    children: ReactNode
}

export const SidebarItem: FC<ISidebarItemProps> = ({icon,text,link }) => {
    const state = useSelector((state: RootState) => state.ui.sidebarState)
    let location=useLocation();

    let iconClass,bgCol,
        textClass = state != ESidebarState.Full ? "hidden" : "";

    if(location.pathname===link) {
        iconClass = "text-blue-400"
        bgCol = "scale-x-100 bg-pr-3 border-l-[3px]"
        textClass += " text-fg-2"
    }
    else {
        iconClass = "text-fg-1 hover:bg-stroke-1"
        bgCol = "scale-x-0"
    }

    return (
        <Link to={link}
              className={`py-[21px] btn flex items-start justify-center flex-col group relative ${iconClass}`}>
            <div className="z-10 flex-col flex items-center w-full justify-center pointer-events-none">
                {icon}
                <p className={`mt-3 font-bold text-sm ${textClass}`}>{text}</p>
            </div>

            <div className={`w-full h-full origin-left border-l-pr-4 absolute duration-500 transition-all ${bgCol}`}/>

            {state == ESidebarState.Partial && (
                <div className={`absolute left-full rounded-md px-2 py-1 ml-5
                                     bg-pr-3 text-fg-2 text-sm
                                     invisible opacity-20 -translate-x-3 transition-all
                                     group-hover:visible group-hover:opacity-100 group-hover:translate-x-0`}>
                    {text}
                </div>
            )}
        </Link>
    );
}

export const Sidebar: FC<ISidebarProps> = ({children}) => {
    let state = useSelector<RootState>((state) => state.ui.sidebarState)
    const {changeSidebarState} = useActions()

    const sideBarState = useRef(ESidebarState.Full);
    const isSmallScreen = useMediaQuery( {
        query: '(max-width: 1023px)',
        callback: (match: boolean) => changeSidebarState(match ? ESidebarState.Hidden : ESidebarState.Full)
    });

    if(state == undefined) {
        changeSidebarState( state = (isSmallScreen ? ESidebarState.Hidden : ESidebarState.Partial));
    }

    const sliderRef = useSlider((event: PointerEvent) => {
        let newState: ESidebarState | null = null;

        if(event.clientX < 30 && sideBarState.current != ESidebarState.Hidden) {
            newState = ESidebarState.Hidden
        }
        else if(event.clientX > 60 && event.clientX < 100 && sideBarState.current != ESidebarState.Partial) {
            newState = ESidebarState.Partial
        }
        else if(event.clientX > 165 && sideBarState.current != ESidebarState.Full) {
            newState = ESidebarState.Full
        }

        if(newState != null) {
            changeSidebarState(newState)
            sideBarState.current = newState;
        }
    });

    return (
        <aside className={`fixed lg:relative flex flex-shrink-0 h-full z-10`}>
            <nav className={`h-full flex flex-col bg-pr-2  transition-all 
                          ${state == ESidebarState.Full ? "w-52" : state == ESidebarState.Partial ? "w-16" : "w-0 overflow-hidden"}`}>

                <div className={`lg:h-[48px] border-b-2 border-b-stroke-1`}/>

                <ul className="flex-1"> {children} </ul>
                <div className={`border-t border-pr-3 px-[11px] py-3 flex overflow-hidden`}>
                    <img
                        src="https://ui-avatars.com/api/?background=c7d2fe&color=3730a3&bold=true"
                        alt=""
                        className="w-10 h-10 rounded-md"
                    />
                    <div className="pl-2 flex-col flex justify-center text-nowrap w-full overflow-hidden relative">
                        <h4 className="text-fg-3 text-sm">Kitbyte</h4>
                        <span className="text-fg-1 text-xs">kit8.com</span>
                        <div className="absolute w-1/3 h-full right-0 bg-gradient-to-r from-transparent to-pr-2"/>
                    </div>
                </div>
            </nav>

            <div ref={sliderRef} className="pl-1 items-center transition-all h-full opacity-0 hover:opacity-100
                                            cursor-col-resize hidden lg:flex absolute -right-2">
                <div className="bg-pr-4 h-32 w-1  rounded-xl"/>
            </div>

            {state != ESidebarState.Hidden && isSmallScreen &&
                <div className="lg:static bg-black opacity-50 w-screen"
                     onClick={() => changeSidebarState(ESidebarState.Hidden)}></div>
            }
        </aside>
    )
}