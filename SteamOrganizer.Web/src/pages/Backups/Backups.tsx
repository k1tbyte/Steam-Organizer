import BackupCard from "./BackupCard.tsx";
import Ref from "@/types/ref.ts";
import {GridLayout} from "@/components/primitives/VirtualScroller/GridLayout.ts";
import {backupsInfo, loadBackupsInfo} from "@/store/config.ts";

import VirtualScroller from "@/components/primitives/VirtualScroller/VirtualScroller.tsx";
import {useEffect} from "react";
import {useAuth} from "@/providers/authProvider.tsx";
const backupsGrid: Ref<GridLayout> = new Ref<GridLayout>();
export default function Backups(){
    const { user} = useAuth();
    useEffect(() => {
        if(user.isLoggedIn)
            loadBackupsInfo();
    }, [user.isLoggedIn]);
    useEffect(() => {
        backupsGrid.payload?.refresh();
    }, [backupsInfo]);
    return (
        <div>
            <VirtualScroller collection={backupsInfo} layout={GridLayout} gridRef={backupsGrid}
                             className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] p-2 gap-2"
                             emptyIndicator={<p className="absolute translate-center text-foreground-muted">
                                 The list of backups is empty
                             </p>}
                             renderElement={(i) => <BackupCard info={backupsInfo[i]} key={i}/>}
            />

        </div>
    );
}