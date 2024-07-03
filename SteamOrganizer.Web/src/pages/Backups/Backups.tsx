import BackupCard from "./BackupCard.tsx";
import VirtualScroller from "@/components/primitives/VirtualScroller/VirtualScroller.tsx";
import {GridLayout} from "@/components/primitives/VirtualScroller/GridLayout.ts";
import AccountCard from "@/pages/Accounts/elements/AccountCard.tsx";
import {backups, loadBackups} from "@/store/backups.ts";
import {useEffect, useState} from "react";
import {useAuth} from "@/providers/authProvider.tsx";
import {Loader} from "@/components/primitives/Loader.tsx";
import {uploadFileJson} from "@/services/gDrive.ts";

export default function Backups(){
    const { user  } = useAuth()
    const [isLoading, setLoading] = useState(true)

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

    if(isLoading) {
        return <Loader className="w-full h-full flex-center"/>
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