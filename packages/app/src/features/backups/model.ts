export type { Backup, BackupKind } from '@so/core'

export type SyncState = 'synced' | 'syncing' | 'error' | 'offline'

export const SYNC_INTERVALS = ['5', '15', '30'] as const
/** Minutes between automatic syncs while the app stays open. */
export type SyncInterval = (typeof SYNC_INTERVALS)[number]

/** Kept per device: each one picks how it syncs. */
export interface SyncSettings {
    autoSync: boolean
    interval: SyncInterval
    autoBackup: boolean
}

export const SYNC_DEFAULTS: SyncSettings = {
    autoSync: true,
    interval: '15',
    autoBackup: true,
}

/** What the sync engine tells the screens: the copy left Drive, or a sync failed after a good one. */
export type SyncNotice =
    | { kind: 'gone'; vaultName: string }
    | { kind: 'failed' }

/** One line of the history, as the screen shows it. */
export interface BackupRow {
    id: string
    title: string
    icon: string
    meta: string
    /** Phones drop the size. */
    metaShort: string
    latest: boolean
    saving: boolean
    confirmingDelete: boolean
}

export interface BackupsVault {
    name: string
    accounts: number
}
