import { defineMock } from '#core'

import type { SiteKey } from './model'

export interface SteamAccess {
    grants: Record<SiteKey, boolean>
    /** Firefox asks for each site separately. */
    firefox: boolean
}

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
