import { generateNKeysBetween } from 'fractional-indexing'

import type { AccountSlots } from '../crypto/accountKeys'

/** `data.kind` of a record: what it holds is known only once opened. */
export const RECORD = {
    SETTINGS: 1,
    ACCOUNT: 2,
    TAG: 3,
    PRESET: 4,
    SERVICE: 5,
} as const

export const CREDENTIAL_KINDS = [
    'login',
    'email',
    'password',
    'secret-word',
    'phone',
] as const
export type CredentialKind = (typeof CREDENTIAL_KINDS)[number]

/** Fields the vault's settings place in `data` (searchable) or `secret`. */
export const MOVABLE_FIELDS = ['login', 'note', 'phone', 'email'] as const
export type MovableField = (typeof MOVABLE_FIELDS)[number]
export type FieldPlacement = 'searchable' | 'secret'
export type Movable = Partial<Record<MovableField, string>>

export const FIELD_DEFAULTS: Record<MovableField, FieldPlacement> = {
    login: 'searchable',
    note: 'searchable',
    phone: 'secret',
    email: 'secret',
}

export interface SteamBans {
    vac: number
    game: number
    community: boolean
    economy: 'none' | 'probation' | 'banned'
    lastBanDays: number | null
}

export interface SteamStats {
    games: number
    played: number
    hours: number
    paid: number
    value: number
    badge: string
    friends: number
}

/** The last refresh from Steam; a refresh moves `refreshedAt`, never the account's `editedAt`. */
export interface SteamSnapshot {
    refreshedAt: number
    nickname: string
    avatar: string
    level: number
    registeredAt: number | null
    visibility: 'public' | 'friends' | 'private'
    vanity: string | null
    bans: SteamBans
    stats: SteamStats | null
}

export type LockScope = 'credentials' | 'everything'

/** An account's own password: its secret is sealed with an account key these slots open. */
export interface AccountLock {
    scope: LockScope
    slots: AccountSlots
    /** The Steam nickname and avatar an `everything` lock leaves the list. */
    shown?: { nickname: string; avatar: string }
    /** `steamTag` of the Steam ID an `everything` lock hides: duplicates still show. */
    steamTag?: string
}

export interface AccountData extends Movable {
    kind: typeof RECORD.ACCOUNT
    alias?: string
    /** SteamID64; null for an account with credentials only. */
    steamId: string | null
    /** TAG record ids. */
    tags: string[]
    pinned: boolean
    /** Fractional index of the vault order. */
    order: string
    addedAt: number
    editedAt: number
    guard: boolean
    /** `loginTag` of the login: duplicates show without opening a secret. */
    loginTag: string
    steam: SteamSnapshot | null
    lock?: AccountLock
}

/** An account's credentials for one linked service, at most one entry per service. */
export interface ServiceCredentials {
    /** A built-in service's id, or a SERVICE record's. */
    service: string
    fields: { kind: CredentialKind; value: string }[]
}

/** The shortest password an account or a linked service takes. */
export const MIN_PASSWORD_LENGTH = 6

export interface AccountSecret extends Movable {
    password: string
    services: ServiceCredentials[]
    authenticator?: Authenticator
    /** The data an `everything` lock sealed with the rest. */
    hidden?: Partial<AccountData>
}

/** Steam Guard from an imported maFile; the whole file is kept for an export. */
export interface Authenticator {
    sharedSecret: string
    identitySecret: string
    revocationCode: string
    maFile: Record<string, unknown>
}

export interface TagData {
    kind: typeof RECORD.TAG
    label: string
    hue: number
}

/** A linked service the user added beyond the built-in ones. */
export interface ServiceData {
    kind: typeof RECORD.SERVICE
    name: string
    /** SVG markup, drawn as a one-color mask. */
    icon?: string
}

const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null

/** A missing field reads as its default, so adding one never needs a format version. */
export function readAccount(value: unknown): AccountData | null {
    if (!isObject(value) || value.kind !== RECORD.ACCOUNT) return null
    const defaults: Omit<AccountData, 'kind'> = {
        steamId: null,
        tags: [],
        pinned: false,
        order: 'a0',
        addedAt: 0,
        editedAt: 0,
        guard: false,
        loginTag: '',
        steam: null,
    }
    return { ...defaults, ...value } as AccountData
}

export function readTag(value: unknown): TagData | null {
    if (!isObject(value) || value.kind !== RECORD.TAG) return null
    return { label: '', hue: 0, ...value } as TagData
}

export function readService(value: unknown): ServiceData | null {
    if (!isObject(value) || value.kind !== RECORD.SERVICE) return null
    return { name: '', ...value } as ServiceData
}

/** `count` order keys between two neighbours (null past either end), ascending. */
export const orderKeys = (
    after: string | null,
    before: string | null,
    count: number,
) => generateNKeysBetween(after, before, count)
