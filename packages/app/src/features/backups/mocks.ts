import { defineMock } from '#core'

import type { SyncSnapshot } from './model'

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
