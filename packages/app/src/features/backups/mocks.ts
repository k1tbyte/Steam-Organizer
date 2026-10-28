import { defineMock } from '#core'

import type { Backup, BackupsVault, SyncSnapshot } from './model'

const KB = 1024

/** Today or yesterday at a clock time, so "Today, 13:50" stays true whenever the mock runs. */
function recent(daysAgo: number, hour: number, minute: number): number {
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    date.setHours(hour, minute, 0, 0)
    return date.getTime()
}

const at = (day: number, month: number, hour: number, minute: number) =>
    new Date(2026, month, day, hour, minute).getTime()

const SEVEN: Backup[] = [
    {
        id: 'b1',
        kind: 'auto',
        createdAt: recent(0, 13, 50),
        accounts: 128,
        sizeBytes: 186 * KB,
    },
    {
        id: 'b2',
        kind: 'manual',
        name: 'Before cleanup',
        createdAt: recent(0, 9, 12),
        accounts: 128,
        sizeBytes: 186 * KB,
    },
    {
        id: 'b3',
        kind: 'auto',
        createdAt: recent(1, 22, 40),
        accounts: 126,
        sizeBytes: 183 * KB,
    },
    {
        id: 'b4',
        kind: 'auto',
        createdAt: at(7, 9, 11, 40),
        accounts: 126,
        sizeBytes: 183 * KB,
    },
    {
        id: 'b5',
        kind: 'auto',
        createdAt: at(19, 8, 18, 32),
        accounts: 125,
        sizeBytes: 181 * KB,
        olderPassword: true,
    },
    {
        id: 'b6',
        kind: 'auto',
        createdAt: at(22, 7, 0, 46),
        accounts: 124,
        sizeBytes: 179 * KB,
        olderPassword: true,
    },
    {
        id: 'b7',
        kind: 'manual',
        name: 'After import',
        createdAt: at(11, 7, 20, 11),
        accounts: 124,
        sizeBytes: 179 * KB,
        olderPassword: true,
    },
]

export const syncMock = defineMock<SyncSnapshot>(
    'backups.sync',
    'Sync status',
    {
        Synced: { state: 'synced', ago: '2 min ago' },
        Syncing: { state: 'syncing', ago: '2 min ago' },
        Error: { state: 'error', ago: '3 days ago' },
        Offline: { state: 'offline', ago: '2 min ago' },
    },
)

export const historyMock = defineMock<Backup[]>(
    'backups.history',
    'Backup history',
    {
        'Seven backups': SEVEN,
        'One backup': SEVEN.slice(0, 1),
        'None on Drive': [],
        'Long custom names': [
            {
                id: 'l1',
                kind: 'manual',
                name: 'Before I merged the old farm accounts into the main vault and removed every duplicate',
                createdAt: recent(0, 13, 50),
                accounts: 128,
                sizeBytes: 1.4 * 1024 * KB,
                olderPassword: true,
            },
            {
                id: 'l2',
                kind: 'manual',
                name: 'After import',
                createdAt: recent(1, 22, 40),
                accounts: 126,
                sizeBytes: 183 * KB,
            },
            {
                id: 'l3',
                kind: 'manual',
                name: 'Snapshot_2026-08-11_final_FINAL_v2_do-not-delete',
                createdAt: at(11, 7, 20, 11),
                accounts: 124,
                sizeBytes: 179 * KB,
                olderPassword: true,
            },
        ],
    },
)

export const vaultMock = defineMock<BackupsVault>(
    'backups.vault',
    'Vault location',
    {
        'Main vault on Drive': {
            name: 'Main vault',
            accounts: 128,
            location: 'drive',
        },
        'Farm, this device only': {
            name: 'Farm',
            accounts: 42,
            location: 'device',
        },
    },
)
