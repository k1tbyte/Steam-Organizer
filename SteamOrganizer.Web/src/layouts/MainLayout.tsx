import {FC} from "react";
import {Sidebar, SidebarItem} from "../components/Sidebar.tsx";
import {LuFolderSync, LuUsers, LuZap} from "react-icons/lu";
import {Header} from "../components/Header.tsx";
import {Outlet} from "react-router-dom";

export  const MainLayout: FC= () => {
    return (
        <>
            <Sidebar>
                <SidebarItem icon={<LuUsers size={20}/>} text="Accounts" link="/accounts"/>
                <SidebarItem icon={<LuZap size={20}/>} text="Actions" link="/actions"/>
                <SidebarItem icon={<LuFolderSync size={20}/>} text={"Backups"} link="/backups"/>
            </Sidebar>
            <div className="flex flex-col h-full w-full">
                <Header/>
                <Outlet/>
            </div>
        </>
    )
}