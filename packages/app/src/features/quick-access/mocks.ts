import { defineMock } from '#core'

import type { TabContext } from './model'

/** What the demo accepts for a locked account, and what Copy password puts on the clipboard: no vault is decrypted yet. */
export const DEMO_ACCOUNT_PASSWORD = 'demo'
export const DEMO_STEAM_PASSWORD = '********'

export const tabMock = defineMock<TabContext>(
    'quick-access.tab',
    'Active browser tab',
    {
        'Steam sign-in': {
            kind: 'signin',
            address: 'store.steampowered.com/login',
        },
        'Steam Guard prompt': {
            kind: 'guard',
            address: 'store.steampowered.com/login',
        },
        'Another site': { kind: 'other', address: 'example.com' },
    },
)
