import { LuAlignJustify  } from "react-icons/lu";
import { HiMiniCog6Tooth } from "react-icons/hi2";
import { FaBell } from "react-icons/fa";


export default function Header() {
    return (
        <div className="w-full flex justify-between items-center bg-pr-2 h-12 border-b-2 border-b-stroke-1 px-3
        text-fg-2">
            <LuAlignJustify size={20} />
            <div className="flex items-center gap-5 mr-1">
                <FaBell size={17}  />
                <HiMiniCog6Tooth size={17}  />
            </div>
        </div>
    )
}