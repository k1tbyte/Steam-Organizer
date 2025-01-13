import BackupCard from "./BackupCard";
import {GridLayout} from "@/shared/ui/VirtualScroller/GridLayout";
import {backups, loadBackups} from "@/store/backups";
import {useEffect, useState} from "react";
import {useAuth} from "@/providers/authProvider";
import {Loader, LoaderStatic} from "@/shared/ui/Loader";
import {useOfflineRedirect} from "@/store/local";
import {EmptyCollectionIndicator} from "@/components/CollectionIndicator";
import {VirtualScroller} from "@/shared/ui/VirtualScroller/VirtualScroller";
import {useTitle} from "@/shared/hooks/useTitle";

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

    useTitle("Backups")


    if(isLoading) {
        return <Loader className="w-full h-full flex-center"/>
    }

    if(user.isLoggedIn === false) {
        return <LoaderStatic text="Log in to view backups"/>
    }

    return (
        <VirtualScroller collection={backups} layout={GridLayout}
                         scrollerClassName="my-2"
                         className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] mx-2 gap-2"
                         emptyIndicator={<EmptyCollectionIndicator/>}
                         onRenderElement={(o,i) => <BackupCard backup={o} key={o.fileId}/>}
        />
    );
}