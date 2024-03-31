import {Sidebar, SidebarItem} from "../components/Sidebar.tsx";
import {LuFolderSync, LuUsers, LuZap} from "react-icons/lu";
import Header from "../components/Header.tsx";
import {HomeLayout} from "../layouts/HomeLayout.tsx";

export default function Home() {
    return (
        <HomeLayout sidebar={
            /*// @ts-ignore*/
            <Sidebar>
                <SidebarItem icon={<LuUsers size={20}/>} text="Accounts" active={true}/>
                <SidebarItem icon={<LuZap size={20}/>} text="Actions"/>
                <SidebarItem icon={<LuFolderSync size={20}/>} text="Backups"/>
            </Sidebar>
        } header={
            <Header/>
        } content={
            <div className="flex justify-center w-full items-center">Content area</div>
        }/>
    )
}