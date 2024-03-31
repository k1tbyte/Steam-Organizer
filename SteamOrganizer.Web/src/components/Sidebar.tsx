import React, {createContext, FC, ReactNode, useContext, useRef, useState} from 'react'
import { useSlider } from "../hooks/useResizable.tsx";

interface ISidebarItemProps {
    icon: ReactNode
    text: string
    active?: boolean
}

const enum ESidebarState {
    Hidden= "hidden",
    Partial = "w-16",
    Full = "w52"
}

const defaultState = ESidebarState.Full
const SidebarContext: React.Context<ESidebarState> = createContext<ESidebarState>(defaultState)

export const SidebarItem: FC<ISidebarItemProps> = ({icon,text, active }) => {
    const state : ESidebarState = useContext(SidebarContext)

    let iconClass,bgCol, textClass
    if(active) {
        iconClass = "text-blue-400"
        bgCol = "bg-pr-3"
        textClass = "text-fg-2"
    }
    else {
        iconClass = "text-fg-1"
        bgCol = "hover:bg-stroke-1 transition-all"
        textClass = ""
    }

    if(state == ESidebarState.Partial) {
        textClass += " hidden"
    }

    return (
        <li className={`py-5 btn flex items-center justify-center flex-col group relative ${iconClass} ${bgCol}`}>
            {icon}
            <p className={`mt-3 font-bold text-sm ${textClass}`}>{text}</p>
            {state == ESidebarState.Partial && (
                <div className={`absolute left-full rounded-md px-2 py-1 ml-5
                                 bg-pr-3 text-fg-2 text-sm
                                 invisible opacity-20 -translate-x-3 transition-all
                                 group-hover:visible group-hover:opacity-100 group-hover:translate-x-0`}
                >
                    {text}
                </div>
            )}
        </li>
    )
}

export const Sidebar: FC = ({ children }: any) => {

    const [state,setSidebarState] = useState(defaultState);
    const sideBarState = useRef(defaultState);

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
            setSidebarState(newState)
            sideBarState.current = newState;
        }
    });

    let userImgAlign = "", userInfoVis  = ""
    if(state == ESidebarState.Partial) {
        userImgAlign = "justify-center"
        userInfoVis = "hidden"
    }

    return (
        <aside className="h-full flex flex-shrink-0">
            <nav className={`h-full flex flex-col bg-pr-2 border-r-2 border-r-stroke-1 ${state}`}>
                <SidebarContext.Provider value={state}>
                    <ul className="flex-1 text-center">
                        {children}
                    </ul>
                </SidebarContext.Provider>
                <div className={`border-t border-pr-3 p-3 flex ${userImgAlign}`}>
                    <img
                        src="https://ui-avatars.com/api/?background=c7d2fe&color=3730a3&bold=true"
                        alt=""
                        className="w-10 h-10 rounded-md"
                    />
                    <div className={`pl-2 flex-col flex justify-center text-nowrap overflow-hidden relative ${userInfoVis}`}>
                        <h4 className="text-fg-3 text-sm">Kitbyte</h4>
                        <span className="text-fg-1 text-xs" >kit8byte@gmail.com</span>
                        <div className="absolute w-1/3 h-full right-0 bg-gradient-to-r from-transparent to-pr-2"></div>
                    </div>
                </div>
            </nav>
            <div ref={sliderRef} className="pl-1 flex items-center transition-all h-full opacity-0 hover:opacity-100 cursor-col-resize">
                <div className="bg-pr-4 h-32 w-1  rounded-xl" >
                </div>
            </div>
        </aside>
    )
}