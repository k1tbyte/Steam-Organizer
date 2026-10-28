export type SyncState = 'synced' | 'syncing' | 'error' | 'offline'

export interface SyncSnapshot {
    state: SyncState
    /** Relative time of the last good sync, as the status line shows it. */
    ago: string
}

export type BackupKind = 'auto' | 'manual'

export interface Backup {
    id: string
    kind: BackupKind
    /** Chosen by the user on a manual backup. */
    name?: string
    createdAt: number
    accounts: number
    sizeBytes: number
    /** Made before the master password last changed: restoring asks for the old one. */
    olderPassword?: boolean
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
    olderPassword: boolean
    saving: boolean
    confirmingDelete: boolean
}

export interface BackupsVault {
    name: string
    accounts: number
    /** `device` vaults have no history: they are offered a move to Drive. */
    location: 'drive' | 'device'
}
