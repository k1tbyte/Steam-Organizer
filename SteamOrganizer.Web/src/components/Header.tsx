import {LuAlignJustify} from "react-icons/lu";
import {HiMiniCog6Tooth} from "react-icons/hi2";
import {FaBell} from "react-icons/fa";
import {FC} from "react";
import {modal} from "@/components/elements/Modal.tsx";
import {ESidebarState, setState } from "@/components/Sidebar.tsx";

export const Header: FC = () => {

    return (
        <div className="w-full flex justify-between items-center bg-pr-2 h-12 border-b-2 border-b-stroke-1 px-3
        text-fg-2 flex-shrink-0">
            <div className="flex">
                <LuAlignJustify className=" lg:invisible"  size={20} onClick={() => {
                    setState(prev =>
                        prev == ESidebarState.Hidden ? ESidebarState.Full : ESidebarState.Hidden)
                }} />

            </div>

            <div className="flex items-center gap-5 mr-1">
                <FaBell size={17} />
                <HiMiniCog6Tooth size={17} className="cursor-pointer" onClick={() => {
                    modal.open({
                        className: "w-full max-w-[405px]",
                        title: "Settings",
                        body:
                            <div className="text-[13px] text-fg-2">
                                Settings component
                            </div>
                    })
                }}/>
            </div>
        </div>
    )
}