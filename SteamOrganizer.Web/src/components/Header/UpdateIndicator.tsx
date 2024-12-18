import {FC, useState} from "react";
import {ESavingState} from "@/components/Header/SaveIndicator.tsx";
import {Gradients, Icon, SvgIcon} from "src/defines";
import {flagStore, useFlagStore} from "@/store/local.tsx";

export const UpdateIndicator: FC = () => {
    const [count,] = useFlagStore<number>(nameof(flagStore.store.dbUpdateCount));

    if(!count) {
        return;
    }

    return (
        <div className="relative flex-center overflow-clip">
            <SvgIcon icon={Icon.LoaderCircle} className="animate-spin-fast" size={35} stroke={Gradients.LightBlue}/>
            <small style={{fontSize: "8px"}}
                   className="absolute translate-center">{
                count > 99 ? "99+" : count
            }</small>
        </div>
    )
}