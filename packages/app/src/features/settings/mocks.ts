import { defineMock } from '#core'

import type { SiteKey } from './model'

export interface AboutApp {
    version: string
    /** Newer release the footer offers, if any. */
    update: string | null
}

export interface VaultInfo {
    name: string
    accounts: number
    /** Steam Guard authenticators the vault holds. */
    authenticators: number
    created: string
}

export interface GoogleAccount {
    name: string
    email: string
    syncedMinutesAgo: number
}

export interface SteamAccess {
    apiKey: string
    /** Result of checking the key against Steam. */
    keyWorks: boolean
    grants: Record<SiteKey, boolean>
    /** Firefox asks for each site separately. */
    firefox: boolean
}

export const aboutMock = defineMock<AboutApp>('settings.about', 'App version', {
    'Update available': { version: '3.0.1', update: '3.0.2' },
    'Up to date': { version: '3.0.1', update: null },
})

export const vaultMock = defineMock<VaultInfo>('settings.vault', 'Vault', {
    'Main vault': {
        name: 'Main vault',
        accounts: 12,
        authenticators: 5,
        created: '11 Nov 2024',
    },
    'Long name': {
        name: 'Family and friends shared Steam accounts vault',
        accounts: 148,
        authenticators: 31,
        created: '3 Feb 2023',
    },
    'Empty vault': {
        name: 'New vault',
        accounts: 0,
        authenticators: 0,
        created: '21 Oct 2026',
    },
})

export const googleMock = defineMock<GoogleAccount>(
    'settings.google',
    'Google account',
    {
        'Alex Kim': {
            name: 'Alex Kim',
            email: 'alex.kim@gmail.com',
            syncedMinutesAgo: 2,
        },
        'Long identity': {
            name: 'Alexandria Konstantinopoulou-Williams',
            email: 'alexandria.konstantinopoulou.williams@example-company.com',
            syncedMinutesAgo: 41,
        },
    },
)

export const backupsMock = defineMock<{ count: number }>(
    'settings.backups',
    'Drive backups',
    {
        'Seven backups': { count: 7 },
        'One backup': { count: 1 },
        None: { count: 0 },
    },
)

export const steamMock = defineMock<SteamAccess>(
    'settings.steam',
    'Steam access',
    {
        'Firefox, key set': {
            apiKey: 'A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6',
            keyWorks: true,
            grants: { store: true, community: true, help: false },
            firefox: true,
        },
        'Chromium, all allowed': {
            apiKey: 'A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6',
            keyWorks: true,
            grants: { store: true, community: true, help: true },
            firefox: false,
        },
        'No key, nothing allowed': {
            apiKey: '',
            keyWorks: false,
            grants: { store: false, community: false, help: false },
            firefox: true,
        },
    },
)
