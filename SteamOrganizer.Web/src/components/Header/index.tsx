import {FC} from "react";
import { setState } from "@/components/Sidebar/Sidebar";
import { Icon, SvgIcon} from "src/defines";
import {openSettings } from "@/pages/Modals/Settings";
import {SaveIndicator} from "./SaveIndicator";
import {ESidebarState} from "@/types/uiMetadata";
import {UpdateIndicator} from "@/components/Header/UpdateIndicator";
import {NetworkIndicator} from "@/components/Header/NetworkIndicator";
import {EPlacement} from "@/shared/ui/Popup/positioning";
import {Popup} from "@/shared/ui/Popup/Popup";

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
                <NetworkIndicator/>
                <UpdateIndicator/>
                <SaveIndicator/>
                <Popup placement={EPlacement.MiddleLeft} offset={{ y: 15, x: -15 }} content={
                    <div className="px-10 py-5">
                        <p className="text-sm">No notifications</p>
                    </div>
                }>
                    <SvgIcon icon={Icon.Bell} size={17} className="cursor-pointer ml-5 mr-2" />
                </Popup>
                <SvgIcon icon={Icon.Cog} size={17} className="cursor-pointer" onClick={openSettings}/>
            </div>
        </div>
    )
}