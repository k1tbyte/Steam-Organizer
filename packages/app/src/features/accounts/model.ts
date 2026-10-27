import type { LockScope } from '@so/core'

export const BAN_KINDS = ['vac', 'game', 'community', 'economy'] as const
export type BanKind = (typeof BAN_KINDS)[number]

/** A label with its dot color; the hue is the tag's own, not derived from the name. */
export interface AccountTag {
    /** The TAG record's id. */
    id: string
    label: string
    hue: number
}

/** A vault account as the list and the card show it; wave 3's profile reads the same shape. */
/** An account's own password, asked even with the vault open. */
export interface LockInfo {
    scope: LockScope
    /** The vault's master password can open it. */
    recovery: boolean
}

export interface Account {
    id: string
    /** The alias, else the Steam nickname, else the login. */
    nickname: string
    alias: string | null
    /** Null for an anonymous account. */
    steamNickname: string | null
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
    /** The vault keeps notes secret: `note` is empty here and opens only in the profile. */
    noteSecret?: boolean
    /** Present only while the vault keeps them searchable. */
    phone?: string
    email?: string
    /** The account's own password, when it has one. */
    lock?: LockInfo
    /** Has its own password and is not open now: its secrets stay sealed. */
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

export const SEARCH_FIELDS = [
    'nickname',
    'login',
    'note',
    'phone',
    'email',
] as const
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

export const TAG_MATCHES = ['any', 'all'] as const
export type TagMatch = (typeof TAG_MATCHES)[number]

/** The list's remembered view: search, ban and tag filters, and sort. */
export interface AccountsView {
    query: string
    field: SearchField
    bans: BanFilters
    /** Tag ids; `any` shows accounts with one of them, `all` with every one. */
    tags: string[]
    tagMatch: TagMatch
    sort: SortKey
    direction: SortDirection
}

/** A bulk refresh in flight: accounts left and how far along it is (0 to 1). */
export interface RefreshProgress {
    remaining: number
    progress: number
}
