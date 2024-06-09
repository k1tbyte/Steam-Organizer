import {FC} from "react";
import {Sidebar, SidebarItem} from "../components/Sidebar.tsx";
import {Header} from "../components/Header.tsx";
import {Outlet} from "react-router-dom";
import {Icon, SvgIcon} from "@/assets";

export  const MainLayout: FC= () => {
    return (
        <>
            <Sidebar>
                <SidebarItem icon={<SvgIcon icon={Icon.UsersOutline} size={20}/>} text="Accounts" link="/accounts"/>
                <SidebarItem icon={<SvgIcon icon={Icon.LightningOutline} size={20}/>} text="Actions" link="/actions"/>
                <SidebarItem icon={<SvgIcon icon={Icon.FolderSync} size={20}/>} text={"Backups"} link="/backups"/>
            </Sidebar>
            <div className="flex flex-col h-full w-full">
                <Header/>
                <Outlet/>
            </div>
        </>
    )
}