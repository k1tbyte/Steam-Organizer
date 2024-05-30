import {LuAlignJustify} from "react-icons/lu";
import {HiMiniCog6Tooth} from "react-icons/hi2";
import {FaBell} from "react-icons/fa";
import { useStore} from "react-redux";
import { RootState } from "../store/store.ts";
import {useActions} from "../hooks/useActions.ts";
import {ESidebarState} from "../store/ui.slice.ts";
import {FC} from "react";
import {modal} from "@/components/elements/Modal.tsx";

export const Header: FC = () => {
    const store = useStore<RootState>();
    const {  changeSidebarState } = useActions();

    return (
        <div className="w-full flex justify-between items-center bg-pr-2 h-12 border-b-2 border-b-stroke-1 px-3
        text-fg-2 flex-shrink-0">
            <div className="flex">
                <LuAlignJustify className=" lg:invisible"  size={20} onClick={() => {
                    const state = store.getState().ui.sidebarState != ESidebarState.Hidden ? ESidebarState.Hidden : ESidebarState.Full;
                    changeSidebarState(state)
                }} />

            </div>

            <div className="flex items-center gap-5 mr-1">
                <FaBell size={17} />
                <HiMiniCog6Tooth size={17} onClick={() => {
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