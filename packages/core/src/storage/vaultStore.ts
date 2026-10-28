import type { VaultFile } from '../vault/vault'
import { idb } from './idb'

const DB_NAME = 'steam-organizer'
const STORE = 'vaults'

/** Where the vault's source of truth lives; Drive is a layer over either. */
export type VaultHome = 'device' | 'folder'

/** The device's working copy; `name` labels it on the unlock picker and never enters the file. */
export interface StoredVault {
    id: string
    name: string
    home: VaultHome
    file: VaultFile
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
