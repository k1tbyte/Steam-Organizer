import { defineMock } from '#core'

import type { Credential, SessionState, VaultSummary } from './model'

/** What the demo accepts: no vault is decrypted yet. */
const DEMO_PIN = '123456'
const DEMO_PASSWORD = 'demo'
// Stands in for the Windows Hello prompt.
const HELLO_DELAY_MS = 1300

export async function demoVerify(credential: Credential) {
    if (credential.method === 'bio') {
        await new Promise((resolve) => setTimeout(resolve, HELLO_DELAY_MS))
        return true
    }
    return credential.method === 'pin'
        ? credential.pin === DEMO_PIN
        : credential.password === DEMO_PASSWORD
}

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

export const folderAccessMock = defineMock<boolean>(
    'vault.folders',
    'Folder storage',
    { Supported: true, 'Not in this browser (Firefox)': false },
)
