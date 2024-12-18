import { type FC } from "react";
import {Sidebar } from "../components/Sidebar/Sidebar.tsx";
import {Header} from "@/components/Header";
import { Outlet } from "react-router-dom";
import {RouterProvider} from "@/providers/routerProvider.tsx";



export  const MainLayout: FC= () => {

    return (
        <RouterProvider>
            <Sidebar/>
            <div className="flex flex-col h-full w-full">
                <Header/>
                <Outlet/>
            </div>
        </RouterProvider>
    )
}