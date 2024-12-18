import { type ESteamIdType} from "@/lib/steamIdConverter.ts";

export const enum ESidebarState {
    Hidden,
    Partial,
    Full
}

export interface IUiMetadata {
    sidebarState: ESidebarState,
    displayingId: ESteamIdType,

    // Collapsed sections
    community?: boolean,
    bans?: boolean,
    note?: boolean,
    credentials?: boolean,
}