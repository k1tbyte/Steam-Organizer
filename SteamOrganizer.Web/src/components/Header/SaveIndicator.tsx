import {FC, useState} from "react";
import {Gradients, Icon, SvgIcon} from "src/defines";

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
        return <div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20}>
                <use href={`/sprites.svg#i${Icon.CloudSlotRightBelow}`} className="fill-foreground"/>
                <use href={`/sprites.svg#i${Icon.SyncRightBelow}`} className="fill-sky-400">
                    <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="0 19 17.5"
                        to="-360 19 17.5"
                        dur="1s" repeatCount="indefinite"
                    />
                </use>
            </svg>
        </div>
    }

    setTimeout(() => {
        setState(ESavingState.None)
    }, 2000)

    if (state === ESavingState.Error) {
        return <SvgIcon icon={Icon.AlertDecagram} size={17} className="fill-danger animate-ping"/>
    }

    if (state === ESavingState.Saved) {
        return <SvgIcon icon={Icon.CheckCircleOutline} size={17} className="animate-pulse" fill={Gradients.Success}/>
    }
}