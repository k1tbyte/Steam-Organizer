import {FC} from "react";
import { setState } from "@/components/Sidebar/Sidebar.tsx";
import { Icon, SvgIcon} from "@/assets";
import {openSettings } from "@/pages/Modals/Settings.tsx";
import {SaveIndicator} from "./SaveIndicator";
import {ESidebarState} from "@/types/uiMetadata.ts";
import {UpdateIndicator} from "@/components/Header/UpdateIndicator.tsx";

export const Header: FC = () => {

    return (
        <div className="w-full flex justify-between items-center bg-primary h-12 border-b-2 border-b-border px-3 text-foreground flex-shrink-0">
            <div className="flex">
                <SvgIcon icon={Icon.AlignJustify} className=" lg:invisible"  size={20} onClick={() => {
                    setState(prev =>
                        prev == ESidebarState.Hidden ? ESidebarState.Full : ESidebarState.Hidden)
                }} />
            </div>

            <div className="flex items-center gap-2 mr-1">
                <UpdateIndicator/>
                <SaveIndicator/>
                <SvgIcon icon={Icon.Bell} size={17} className="cursor-pointer ml-5 mr-2" />
                <SvgIcon icon={Icon.Cog} size={17} className="cursor-pointer" onClick={openSettings}/>
            </div>
        </div>
    )
}