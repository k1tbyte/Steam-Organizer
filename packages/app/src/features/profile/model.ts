import type { BanKind } from '#features/accounts'

export type Visibility = 'public' | 'friends' | 'private'

export const CREDENTIAL_KINDS = [
    'login',
    'email',
    'password',
    'secret-word',
    'phone',
] as const
export type CredentialKind = (typeof CREDENTIAL_KINDS)[number]

/** Shown masked until revealed. */
export const SECRET_KINDS: readonly CredentialKind[] = [
    'password',
    'secret-word',
]

export interface CredentialField {
    kind: CredentialKind
    value: string
}

/** A set of credentials for one service: Steam itself, its email, a linked launcher. */
export interface CredentialService {
    key: string
    label: string
    icon: string
    /** The user's own name for it, up to 20 characters. */
    name?: string
    fields: CredentialField[]
}

export type LockScope = 'credentials' | 'everything'

/** The account's own password, asked even with the vault open. */
export interface AccountLock {
    scope: LockScope
    /** The vault's master password can open it. */
    recovery: boolean
}

export interface ProfileStats {
    years: number
    games: number
    played: number
    hours: number
    paid: number
    /** US dollars at current store prices. */
    value: number
    /** The collector badge tier, as Steam names it ("100+"). */
    badge: string
    friends: number
}

/** What the profile shows beyond the vault's `Account`: Steam data and the account's own lock. */
export interface ProfileData {
    visibility: Visibility
    /** Epoch ms of the Steam registration. */
    registered: number
    vanity: string | null
    friendCode: string | null
    stats: ProfileStats
    /** Per active ban: since or until when ("Since 12 Mar 2026"). */
    banDetails: Partial<Record<BanKind, string>>
    lastBan: string | null
    lock: AccountLock | null
    services: CredentialService[]
    /** The authenticator's revocation code; null without an authenticator. */
    revocationCode: string | null
}

export const PROFILE_SECTIONS = [
    'credentials',
    'note',
    'community',
    'bans',
] as const
export type ProfileSection = (typeof PROFILE_SECTIONS)[number]

export const NOTE_MAX_LENGTH = 200
