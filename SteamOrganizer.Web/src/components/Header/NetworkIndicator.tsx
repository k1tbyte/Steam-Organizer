import {FC} from "react";
import {flagStore, useFlagStore, useIsOffline} from "@/store/local.tsx";
import {Icon, SvgIcon} from "@/defines";
import {Tooltip} from "@/components/primitives/Popup.tsx";

export const NetworkIndicator: FC = () => {
    const isOffline = useIsOffline();

    return isOffline &&
        <Tooltip message={<span>Offline mode is enabled<br/>Some functionality is not available</span>}>
            <SvgIcon icon={Icon.AlertDecagram} size={17} className="fill-warn"/>
        </Tooltip>
        }