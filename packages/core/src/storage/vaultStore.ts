import type { VaultFile } from '../vault/vault'
import { idb } from './idb'

const DB_NAME = 'steam-organizer'
const STORE = 'vaults'

/** Where the vault's source of truth lives; Drive is a layer over either. */
export type VaultHome = 'device' | 'folder'

/** The vault's link to its Drive copy. */
export interface VaultSync {
    /** The Google account and Drive file the version belongs to; null until the first push. */
    account: string | null
    copyId: string | null
    /** Drive's version of that copy last merged here. */
    version: string | null
    /** The local revision that copy holds: a newer one has changes to push. */
    revision: number
    syncedAt: number | null
}

/** The device's working copy; `name` labels it on the unlock picker and never enters the file. */
export interface StoredVault {
    id: string
    name: string
    home: VaultHome
    file: VaultFile
    /** Moves with every change to the file; missing is 0. */
    revision?: number
    /** Set while the vault syncs through Drive. */
    sync?: VaultSync
}

const db = idb(DB_NAME, 1, (opened) =>
    opened.createObjectStore(STORE, { keyPath: 'id' }),
)

export const vaultStore = {
    list: () => db.read<StoredVault[]>(STORE, (store) => store.getAll()),
    get: (id: string) =>
        db.read<StoredVault | undefined>(STORE, (store) => store.get(id)),
    put: (vault: StoredVault) => db.write(STORE, (store) => store.put(vault)),
    remove: (id: string) => db.write(STORE, (store) => store.delete(id)),
}
