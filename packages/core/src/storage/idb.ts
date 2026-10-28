export function settle<T>(request: IDBRequest<T>) {
    return new Promise<T>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}

/** One IndexedDB database, opened on first use. */
export function idb(
    name: string,
    version: number,
    upgrade: (db: IDBDatabase) => void,
) {
    let database: Promise<IDBDatabase> | null = null
    function open() {
        if (database) return database
        const request = indexedDB.open(name, version)
        request.onupgradeneeded = () => upgrade(request.result)
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

    return {
        async read<T>(
            store: string,
            query: (store: IDBObjectStore) => IDBRequest<T>,
        ) {
            const db = await open()
            return settle(query(db.transaction(store).objectStore(store)))
        },
        // Resolves once the transaction commits, not when the request succeeds: a write is durable only then.
        async write(store: string, change: (store: IDBObjectStore) => void) {
            const db = await open()
            const transaction = db.transaction(store, 'readwrite')
            change(transaction.objectStore(store))
            await new Promise<void>((resolve, reject) => {
                transaction.oncomplete = () => resolve()
                transaction.onerror = () => reject(transaction.error)
                transaction.onabort = () => reject(transaction.error)
            })
        },
    }
}
