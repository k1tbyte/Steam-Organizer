import {ESidebarState, type IUiMetadata} from "@/types/uiMetadata.ts";
import {  ESteamIdType} from "@/lib/steamIdConverter.ts";
import {debounce} from "@/lib/utils.ts";


const name = "localProps"

export const loadLocalProps = () => {
    const stored = localStorage.getItem(name)
    if(stored) {
        return JSON.parse(stored) as IUiMetadata
    }
}


export const localProps: IUiMetadata = loadLocalProps() ?? {
    displayingId: ESteamIdType.AccountID,
    sidebarState: ESidebarState.Full,
    collapsed: {}
}

const save = (param?: any) => localStorage.setItem(name, JSON.stringify(localProps));

export const saveLocalProps = debounce(save, 2000)