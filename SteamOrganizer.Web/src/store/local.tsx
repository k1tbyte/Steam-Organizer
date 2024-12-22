import {ESidebarState, IUiMetadata} from "@/types/uiMetadata.ts";
import {  ESteamIdType } from "@/shared/lib/steamIdConverter.ts";
import {RxStore, useStoreState} from "@/shared/lib/rxStore.tsx";
import {IGlobalFlags} from "@/types/globalFlags.ts";
import {router} from "@/providers/routerProvider.tsx";
import {useEffect} from "react";

export const uiStore = new RxStore<IUiMetadata>({
    displayingId: ESteamIdType.AccountID,
    sidebarState: ESidebarState.Full
},"uiStates")

export const flagStore = new RxStore<IGlobalFlags>({
    offlineMode: !navigator.onLine,
})

export const useUiStore = <T,>(key: string) => {
    return useStoreState<IUiMetadata,T>(uiStore, key)
}

export const useFlagStore = <T,>(key: string) => {
    return useStoreState<IGlobalFlags,T>(flagStore, key)
}

export const useIsOffline = () => {
    return useFlagStore<boolean>(nameof(flagStore.store.offlineMode))[0];
}

export const useOfflineRedirect = () => {
    const isOffline = useIsOffline()
    useEffect(() => {
        if(isOffline) {
            router("/")
        }
    }, [isOffline]);
    return isOffline;
}