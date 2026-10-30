import { defineMock } from '#core'

import type { SiteKey } from './model'

export interface AboutApp {
    version: string
    /** Newer release the footer offers, if any. */
    update: string | null
}

export interface SteamAccess {
    grants: Record<SiteKey, boolean>
    /** Firefox asks for each site separately. */
    firefox: boolean
}

export const aboutMock = defineMock<AboutApp>('settings.about', 'App version', {
    'Update available': { version: '3.0.1', update: '3.0.2' },
    'Up to date': { version: '3.0.1', update: null },
})

export const steamMock = defineMock<SteamAccess>(
    'settings.steam',
    'Steam access',
    {
        Firefox: {
            grants: { store: true, community: true, help: false },
            firefox: true,
        },
        'Chromium, all allowed': {
            grants: { store: true, community: true, help: true },
            firefox: false,
        },
        'Nothing allowed': {
            grants: { store: false, community: false, help: false },
            firefox: true,
        },
    },
)
