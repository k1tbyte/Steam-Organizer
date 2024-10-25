import {FC, useState} from "react";
import {Gradients, Icon, SvgIcon} from "@/assets";

export const enum ESavingState {
    None,
    Syncing,
    Saved,
    Error
}

export let setSavingState: React.Dispatch<React.SetStateAction<ESavingState>>

export const SaveIndicator:FC = () => {
    const [state,setState] = useState<ESavingState>(ESavingState.None)
    setSavingState = setState

    if(state === ESavingState.None) return

    if(state === ESavingState.Syncing) {
        return <SvgIcon icon={Icon.SyncCircle} size={17} className="fill-sky-400 animate-spin"/>
    }

    setTimeout(() => {
        setState(ESavingState.None)
    }, 2000)

    if(state === ESavingState.Error) {
        return <SvgIcon icon={Icon.AlertDecagram} size={17} className="fill-danger animate-ping"/>
    }

    if(state === ESavingState.Saved) {
        return <SvgIcon icon={Icon.CheckCircleOutline} size={17} className="animate-pulse" fill={Gradients.Success}/>
    }
}