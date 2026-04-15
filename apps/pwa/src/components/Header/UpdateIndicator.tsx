import {type FC} from "react";
import {Gradients, Icon, SvgIcon} from "src/defines";
import {Badge} from "@steam-organizer/ui";
import {flagStore, useFlagStore} from "@/store/local";

export const UpdateIndicator: FC = () => {
    const [count,] = useFlagStore<number>(nameof(flagStore.store.dbUpdateCount));

    if(!count) {
        return;
    }

    return (
        <div className="relative flex-center overflow-clip">
            <SvgIcon icon={Icon.LoaderCircle} className="animate-spin-fast" size={35} stroke={Gradients.LightBlue}/>
            <Badge variant="default"
                   className="pointer-events-none absolute translate-center rounded-full px-1.5 text-[8px] leading-none">{
                count > 99 ? "99+" : count
            }</Badge>
        </div>
    )
}