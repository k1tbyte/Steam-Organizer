import type { VaultFile } from '../vault/vault'

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

function settle<T>(request: IDBRequest<T>) {
    return new Promise<T>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}

let database: Promise<IDBDatabase> | null = null
function open() {
    if (database) return database
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () =>
        request.result.createObjectStore(STORE, { keyPath: 'id' })
    // A failed open, a connection the browser closed (storage cleared) or one another context upgrades
    // or deletes is dropped, and the next call opens a fresh one.
    const opening = settle(request).then((db) => {
        db.onclose = forget
        db.onversionchange = () => {
            db.close()
            forget()
        }
        return db
    })
    const forget = () => {
        if (database === opening) database = null
    }
    opening.catch(forget)
    database = opening
    return opening
}

async function read<T>(query: (store: IDBObjectStore) => IDBRequest<T>) {
    const db = await open()
    return settle(query(db.transaction(STORE).objectStore(STORE)))
}

// Resolves once the transaction commits, not when the request succeeds: a write is durable only then.
async function write(change: (store: IDBObjectStore) => void) {
    const db = await open()
    const transaction = db.transaction(STORE, 'readwrite')
    change(transaction.objectStore(STORE))
    await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
        transaction.onabort = () => reject(transaction.error)
    })
}

export const vaultStore = {
    list: () => read<StoredVault[]>((store) => store.getAll()),
    get: (id: string) =>
        read<StoredVault | undefined>((store) => store.get(id)),
    put: (vault: StoredVault) => write((store) => store.put(vault)),
    remove: (id: string) => write((store) => store.delete(id)),
}
