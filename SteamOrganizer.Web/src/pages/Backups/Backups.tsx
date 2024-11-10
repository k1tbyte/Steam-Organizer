import BackupCard from "./BackupCard.tsx";
import VirtualScroller from "@/components/primitives/VirtualScroller/VirtualScroller.tsx";
import {GridLayout} from "@/components/primitives/VirtualScroller/GridLayout.ts";
import {backups, loadBackups} from "@/store/backups.ts";
import {useEffect, useState} from "react";
import {useAuth} from "@/providers/authProvider.tsx";
import {Loader, LoaderStatic} from "@/components/primitives/Loader.tsx";
import {setDocumentTitle} from "@/lib/utils.ts";
import { useOfflineRedirect } from "@/store/local.tsx";

export default function Backups(){
    const { user  } = useAuth()
    const [isLoading, setLoading] = useState(true)
    useOfflineRedirect()


    useEffect(() => {
        if(user.isLoggedIn) {
            setLoading(true)
            loadBackups().then(() => {
                setLoading(false)
            })
            return
        }
        setLoading(user.isLoggedIn === undefined)

    },[user.isLoggedIn])

    useEffect(() => setDocumentTitle("Backups"), []);


    if(isLoading) {
        return <Loader className="w-full h-full flex-center"/>
    }

    if(user.isLoggedIn === false) {
        return <LoaderStatic text="Log in to view backups"/>
    }

    return (
        <VirtualScroller collection={backups} layout={GridLayout}
                         className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] mx-2 gap-2"
                         emptyIndicator={<p className="absolute translate-center text-foreground-muted text-center">
                             The list of backups is empty
                         </p>}
                         renderElement={(o,i) => <BackupCard backup={o} key={i}/>}
        />
    );
}