import type { CredentialKind, ServiceCredentials } from '@so/core'

import type { BanKind, LockInfo } from '#features/accounts'

export { CREDENTIAL_KINDS, type CredentialKind } from '@so/core'

export type Visibility = 'public' | 'friends' | 'private'

/** Shown masked until revealed. */
export const SECRET_KINDS: readonly CredentialKind[] = [
    'password',
    'secret-word',
]

/** Source-English names for `t()`. */
export const CREDENTIAL_LABELS: Record<CredentialKind, string> = {
    login: 'Login',
    email: 'Email',
    password: 'Password',
    'secret-word': 'Secret word',
    phone: 'Phone',
}

export interface CredentialField {
    kind: CredentialKind
    value: string
}

/** What the vault keeps to sign in: Steam's own fields, and each linked service's (its name and icon live in the registry). */
export interface AccountCredentials {
    steam: CredentialField[]
    linked: ServiceCredentials[]
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
    lock: LockInfo | null
    credentials: AccountCredentials
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
