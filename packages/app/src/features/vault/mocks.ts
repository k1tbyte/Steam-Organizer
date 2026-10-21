import { defineMock } from '#core'

import type {
    DriveAccount,
    DriveBackups,
    SessionState,
    VaultSummary,
} from './model'

/** What the demo accepts: no vault is decrypted yet. */
export const DEMO_PIN = '123456'
export const DEMO_PASSWORD = 'demo'

const MAIN: VaultSummary = {
    id: 'main',
    name: 'Main vault',
    location: 'drive',
    meta: '128 accounts · synced 2 min ago',
    methods: ['bio', 'pin', 'pw'],
}
const FARM: VaultSummary = {
    id: 'farm',
    name: 'Farm',
    location: 'device',
    meta: '40 accounts · this device only',
    methods: ['pin', 'pw'],
}
const OBSIDIAN: VaultSummary = {
    id: 'notes',
    name: 'Obsidian',
    location: 'folder',
    meta: '12 accounts · ~/Obsidian/Steam',
    methods: ['pw'],
}

export const sessionMock = defineMock<SessionState>(
    'vault.session',
    'Vault session',
    { Unlocked: 'unlocked', Locked: 'locked', 'New vault': 'new' },
)

export const vaultsMock = defineMock<VaultSummary[]>(
    'vault.list',
    'Vaults on this device',
    {
        'Three vaults': [MAIN, FARM, OBSIDIAN],
        'One vault': [MAIN],
        'Password only': [OBSIDIAN],
    },
)

export const driveAccountMock = defineMock<DriveAccount>(
    'vault.drive',
    'Google account',
    { 'Alex Kim': { name: 'Alex Kim', email: 'alex.kim@gmail.com' } },
)

export const backupsMock = defineMock<DriveBackups | null>(
    'vault.backups',
    'Drive backups',
    {
        'Latest and six more': {
            latest: {
                date: 'Oct 18, 2026 · 21:40',
                meta: '128 accounts · 46 KB',
                accounts: 128,
            },
            others: 6,
        },
        'Only one': {
            latest: {
                date: 'Oct 18, 2026 · 21:40',
                meta: '128 accounts · 46 KB',
                accounts: 128,
            },
            others: 0,
        },
        None: null,
    },
)

export const folderAccessMock = defineMock<boolean>(
    'vault.folders',
    'Folder storage',
    { Supported: true, 'Not in this browser (Firefox)': false },
)
