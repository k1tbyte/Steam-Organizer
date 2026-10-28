import type { VaultKey } from '../crypto/keys'
import { openText, type Sealed, sealText } from '../crypto/seal'
import type { Collection } from '../steam/collection'
import { idb } from './idb'

const ACCOUNTS = 'accounts'
const PRICES = 'prices'

// Apart from the vault's database: unlock never reads it.
const db = idb('steam-organizer-cache', 1, (opened) => {
    opened.createObjectStore(ACCOUNTS)
    opened.createObjectStore(PRICES, { keyPath: 'key' })
})

export interface CachedCollection extends Collection {
    fetchedAt: number
}

interface CachedPrice {
    /** `<currency>:<appId>`. */
    key: string
    appId: number
    cents: number | null
    fetchedAt: number
}

const aad = (id: string) => `cache:${id}`
const listeners = new Set<(id: string) => void>()
const changed = (id: string) => {
    for (const listener of listeners) listener(id)
}

/** Steam data too large for vault records. An account's games and friends are personal, sealed with the vault key; store prices are public. */
export const steamCache = {
    /** null when absent, or sealed under another vault's key. */
    async collection(key: VaultKey, id: string) {
        const sealed = await db.read<Sealed | undefined>(ACCOUNTS, (store) =>
            store.get(id),
        )
        if (!sealed) return null
        try {
            return JSON.parse(
                await openText(key.records, sealed, aad(id)),
            ) as CachedCollection
        } catch {
            return null
        }
    },
    /** `keep` is asked as the write's transaction starts: a change the vault committed before it wins, and a later forget runs after it. */
    async putCollection(
        key: VaultKey,
        id: string,
        entry: CachedCollection,
        keep: () => boolean,
    ) {
        const sealed = await sealText(
            key.records,
            JSON.stringify(entry),
            aad(id),
        )
        await db.write(ACCOUNTS, (store) => {
            if (keep()) store.put(sealed, id)
        })
        changed(id)
    },
    async forgetCollection(id: string) {
        await db.write(ACCOUNTS, (store) => store.delete(id))
        changed(id)
    },
    /** Drops the collections `key` sealed for accounts `held` no longer has; another vault's stay, as they don't open. */
    async pruneCollections(key: VaultKey, held: (id: string) => boolean) {
        const ids = await db.read(ACCOUNTS, (store) => store.getAllKeys())
        for (const id of ids as string[]) {
            if (held(id) || !(await steamCache.collection(key, id))) continue
            // Asked again as the write starts: an account added meanwhile keeps its new entry.
            await db.write(ACCOUNTS, (store) => {
                if (!held(id)) store.delete(id)
            })
            changed(id)
        }
    },
    /** Calls `listener` with an account's id once its collection is written or dropped; returns the unsubscribe. */
    onCollection(listener: (id: string) => void) {
        listeners.add(listener)
        return () => {
            listeners.delete(listener)
        }
    },

    /** The prices in `currency` fetched after `since`, in hundredths; null for a free or unsold game. */
    async prices(currency: string, since: number) {
        // `;` follows `:`: the range holds every key of the currency.
        const stored = await db.read<CachedPrice[]>(PRICES, (store) =>
            store.getAll(IDBKeyRange.bound(`${currency}:`, `${currency};`)),
        )
        return new Map(
            stored
                .filter((price) => price.fetchedAt > since)
                .map((price) => [price.appId, price.cents]),
        )
    },
    putPrices(
        currency: string,
        prices: ReadonlyMap<number, number | null>,
        fetchedAt: number,
    ) {
        return db.write(PRICES, (store) => {
            for (const [appId, cents] of prices)
                store.put({
                    key: `${currency}:${appId}`,
                    appId,
                    cents,
                    fetchedAt,
                } satisfies CachedPrice)
        })
    },
}
