import { LuZap, LuUsers, LuFolderSync } from "react-icons/lu"

export default function Sidebar() {
    return (
        <aside className="h-screen flex">
            <nav className="h-full flex flex-col bg-pr-2  w-52 border-r-2 border-r-stroke-1">
                <ul className="flex-1 text-center">
                    <SidebarItem icon={<LuUsers size={20}/>} text="Accounts" active={true}/>
                    <SidebarItem icon={<LuZap size={20}/>} text="Actions"/>
                    <SidebarItem icon={<LuFolderSync size={20}/>} text="Backups"/>
                </ul>
                <div className="border-t border-pr-3 p-3 flex">
                    <img
                        src="https://ui-avatars.com/api/?background=c7d2fe&color=3730a3&bold=true"
                        alt=""
                        className="w-10 h-10 rounded-md"
                    />
                    <div className="pl-2 flex-col flex justify-center text-nowrap overflow-hidden relative">
                        <h4 className="text-fg-3 text-sm">Kitbyte</h4>
                        <span className="text-fg-1 text-xs" >kit8byte@gmail.com</span>
                        <div className="absolute w-1/3 h-full right-0 bg-gradient-to-r from-transparent to-pr-2"></div>
                    </div>

                </div>
            </nav>
            <div className="pl-1 flex items-center transition-all h-full opacity-0 hover:opacity-100 cursor-col-resize">
                <div className="bg-pr-4 h-32 w-1  rounded-xl" >
                </div>
            </div>
        </aside>
    )
}

export function SidebarItem({icon,text, active}) {
    let iconCol,bgCol, textCol
    if(active) {
        iconCol = "text-blue-400"
        bgCol = "bg-pr-3"
        textCol = "text-fg-2"
    }
    else {
        iconCol = "text-fg-1"
        bgCol = "hover:bg-stroke-1 transition-all"
        textCol = ""
    }

    return (
        <li className={`py-5 cursor-pointer flex items-center justify-center flex-col ${iconCol} ${bgCol}`}>
            {icon}
            <p className={`mt-3 font-bold text-sm ${textCol}`}>{text}</p>
        </li>
    )
}