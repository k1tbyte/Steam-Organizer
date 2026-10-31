import type { VaultFile } from '@so/core'

/** `new`: no vault yet (onboarding), `locked`: unlock screen, `unlocked`: the app. */
export type SessionState = 'new' | 'locked' | 'unlocked'

export type VaultLocation = 'device' | 'drive' | 'folder'

export const LOCATION_ICON: Record<VaultLocation, string> = {
    device: 'icon-[lucide--hard-drive]',
    drive: 'icon-[simple-icons--googledrive]',
    folder: 'icon-[lucide--folder-open]',
}

/** Fits the unlock picker and a Drive backup's label. */
export const MAX_VAULT_NAME_LENGTH = 64

export type UnlockMethod = 'bio' | 'pin' | 'pw'

export interface VaultSummary {
    id: string
    name: string
    location: VaultLocation
    /** The picker's second line: size and where it lives or last synced. */
    meta: string
    methods: UnlockMethod[]
}

/** What a sync pushes and then confirms with `markSynced`: the stored link and revision that file holds. */
export interface SyncReceipt {
    vaultId: string
    revision: number
    /** The Drive copy the vault was linked to when the file was read. */
    link: {
        account: string | null
        copyId: string | null
        version: string | null
    }
    /** Moves with every link and unlink on this device: a receipt from before one is refused. */
    linkEpoch: number
}

/** The open vault's file after a merge with its Drive copy; `push` when the copy lacks something. */
export interface MergedCopy {
    file: VaultFile
    receipt: SyncReceipt
    push: boolean
}

/** The file a lock left with changes still to push. */
export interface LockedSnapshot {
    file: VaultFile
    receipt: SyncReceipt
}

/** `unreadable`: a damaged file or a newer format, which no credential opens. */
export type UnlockResult = 'opened' | 'wrong' | 'unreadable'

export type Credential =
    | { method: 'bio' }
    | { method: 'pin'; pin: string }
    | { method: 'pw'; password: string }

declare module 'vue-router' {
    interface RouteMeta {
        /** Session states that may open the page; unset means unlocked only. */
        vaultAccess?: SessionState[]
        /** Position in the create-vault path; Welcome and Restore sit outside it. */
        onboardingStep?: 1 | 2 | 3
    }
}
