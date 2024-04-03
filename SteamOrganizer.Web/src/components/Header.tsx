import {LuAlignJustify} from "react-icons/lu";
import {HiMiniCog6Tooth} from "react-icons/hi2";
import {FaBell} from "react-icons/fa";
import React from "react";
import { useStore} from "react-redux";
import { RootState } from "../store/store.ts";
import {useActions} from "../hooks/useActions.ts";
import {ESidebarState} from "../store/sidebar.slice.ts";

export const Header: React.FC = () => {
    const store = useStore<RootState>();
    const { changeState } = useActions();

    return (
        <div className="w-full flex justify-between items-center bg-pr-2 h-12 border-b-2 border-b-stroke-1 px-3
        text-fg-2 col-span-2">
            <LuAlignJustify size={20} onClick={() => {
                changeState(store.getState().sidebar.sidebarState == ESidebarState.Full ? ESidebarState.Hidden : ESidebarState.Full)
            }} />
            <div className="flex items-center gap-5 mr-1">
                <FaBell size={17}  />
                <HiMiniCog6Tooth size={17}  />
            </div>
        </div>
    )
}