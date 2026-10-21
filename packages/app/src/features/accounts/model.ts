export const BAN_KINDS = ['vac', 'game', 'community', 'economy'] as const
export type BanKind = (typeof BAN_KINDS)[number]

/** A label with its dot color; the hue is the tag's own, not derived from the name. */
export interface AccountTag {
    label: string
    hue: number
}

/** A vault account as the list and the card show it; wave 3's profile reads the same shape. */
export interface Account {
    id: string
    nickname: string
    /** The Steam login: a secret, so a locked account's is neither shown nor searched. */
    login: string
    /** No Steam profile: credentials only, so level, age, bans and the Steam ID do not apply. */
    anonymous: boolean
    /** Account ID; null for an anonymous account. */
    steamId: string | null
    level: number
    /** Years on Steam as of the last refresh, with the registration month ("Apr 2020"). */
    years: number
    since: string
    /** Avatar tint until a real avatar is fetched. */
    hue: number
    bans: BanKind[]
    tags: AccountTag[]
    pinned: boolean
    /** Has a Steam Guard authenticator in the vault. */
    guard: boolean
    note: string
    /** Credentials sit behind the account's own password. */
    locked: boolean
    /** Epoch ms: when it entered the vault and when Steam data was last refreshed. */
    added: number
    updated: number
}

/** What each card shows. With density and platform they alone decide the card height. */
export interface CardFlags {
    level: boolean
    age: boolean
    id: boolean
    bans: boolean
    tags: boolean
    guard: boolean
    note: boolean
    actions: boolean
}

export const BAN_MODES = ['any', 'require', 'exclude'] as const
export type BanFilterMode = (typeof BAN_MODES)[number]
export type BanFilters = Record<BanKind, BanFilterMode>

export const SEARCH_FIELDS = ['nickname', 'login', 'note'] as const
export type SearchField = (typeof SEARCH_FIELDS)[number]

export const SORT_KEYS = [
    'vault',
    'created',
    'added',
    'updated',
    'level',
] as const
export type SortKey = (typeof SORT_KEYS)[number]
export const SORT_DIRECTIONS = ['asc', 'desc'] as const
export type SortDirection = (typeof SORT_DIRECTIONS)[number]

/** The list's remembered view: search, ban filters and sort. */
export interface AccountsView {
    query: string
    field: SearchField
    bans: BanFilters
    sort: SortKey
    direction: SortDirection
}

/** A Steam profile found for the identifier typed in Add account. */
export interface SteamLookup {
    nickname: string
    level: number
    years: number
    hue: number
    visibility: 'public' | 'friends' | 'private'
    bans: BanKind[]
}

/** A bulk refresh in flight: accounts left and how far along it is (0 to 1). */
export interface RefreshProgress {
    remaining: number
    progress: number
}
