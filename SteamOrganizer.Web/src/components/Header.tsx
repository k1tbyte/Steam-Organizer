import {FC} from "react";
import {modal} from "@/components/primitives/Modal.tsx";
import {ESidebarState, setState } from "@/components/Sidebar.tsx";
import {Icon, SvgIcon} from "@/assets";
import {Settings} from "@/pages/Modals/Settings.tsx";
import {Tooltip} from "@/components/primitives/Tooltip.tsx";

export const Header: FC = () => {

    return (
        <div className="w-full flex justify-between items-center bg-primary h-12 border-b-2 border-b-border px-3 text-foreground flex-shrink-0">
            <div className="flex">
                <SvgIcon icon={Icon.AlignJustify} className=" lg:invisible"  size={20} onClick={() => {
                    setState(prev =>
                        prev == ESidebarState.Hidden ? ESidebarState.Full : ESidebarState.Hidden)
                }} />
            </div>

            <div className="flex items-center gap-5 mr-1">
                <SvgIcon icon={Icon.Bell} size={17} />
                <SvgIcon icon={Icon.Cog} size={17} className="cursor-pointer" onClick={() => {
                    modal.open({
                        title: "Settings",
                        body: <Settings/>
                    })
                }}/>
            </div>
        </div>
    )
}