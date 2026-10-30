export type { Backup, BackupKind } from '@so/core'

export type SyncState = 'synced' | 'syncing' | 'error' | 'offline'

export interface SyncSnapshot {
    state: SyncState
    /** Relative time of the last good sync, as the status line shows it. */
    ago: string
}

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
