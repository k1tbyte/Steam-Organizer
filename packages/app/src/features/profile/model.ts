import type { CredentialKind } from '@so/core'

import type { BanKind } from '#features/accounts'

export { CREDENTIAL_KINDS, type CredentialKind } from '@so/core'

export type Visibility = 'public' | 'friends' | 'private'

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
    /** The user's name for it, else its type's. */
    label: string
    icon: string
    /** The type a named service belongs to, for the hint under its fields. */
    type?: string
    fields: CredentialField[]
}

export const STEAM_SERVICE = {
    key: 'steam',
    label: 'Steam',
    icon: 'icon-[simple-icons--steam]',
} as const

/** Linked service types; a kind the app does not know reads as `other`. */
export const SERVICE_KINDS = ['email', 'faceit', 'discord', 'other'] as const
export type ServiceKind = (typeof SERVICE_KINDS)[number]

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
