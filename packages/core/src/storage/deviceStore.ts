import type { Kdf } from '../crypto/kdf'
import type { Sealed } from '../crypto/seal'
import { createDeviceKey } from '../crypto/secretSlots'
import { idb } from './idb'

const DB_NAME = 'steam-organizer-device'
const KEYS = 'keys'
const SLOTS = 'slots'
const DEVICE_KEY = 'device'

/** A PIN's slot: its own salt, the secret sealed under the PIN key, and the wrong tries counted since the last
 *  master-password unlock. */
export interface PinSlot {
    kdf: Kdf
    key: Sealed
    wrong: number
}

/** A passkey's slot: the credential, and the secret sealed under its PRF output. */
export interface PrfSlot {
    credentialId: string
    key: Sealed
}

/** What opens a vault on this device alone: never in the vault file, never on Drive. */
export interface DeviceSlots {
    pin?: PinSlot
    prf?: PrfSlot
    /** The PIN's PBKDF2 bits and the PRF output, sealed under the vault's `records` key: a master-password unlock
     *  opens them and arms both slots again after a restart. */
    rearm?: { pin?: Sealed; prf?: Sealed }
    /** The session kept past a restart (Lock after: Never), sealed under the device key. */
    kept?: Sealed
}

export type StoredSlots = DeviceSlots & { vaultId: string }

const db = idb(DB_NAME, 1, (opened) => {
    opened.createObjectStore(KEYS)
    opened.createObjectStore(SLOTS, { keyPath: 'vaultId' })
})

const isEmpty = (slots: DeviceSlots) => Object.keys(slots).length === 0

export const deviceStore = {
    /** The device key, made on first use. Two pages racing keep the first one stored. */
    async key(): Promise<CryptoKey> {
        const found = await db.read<CryptoKey | undefined>(KEYS, (store) =>
            store.get(DEVICE_KEY),
        )
        if (found) return found
        const fresh = await createDeviceKey()
        let winner = fresh
        await db.write(KEYS, (store) => {
            const request = store.get(DEVICE_KEY)
            request.onsuccess = () => {
                if (request.result) winner = request.result
                else store.put(fresh, DEVICE_KEY)
            }
        })
        return winner
    },
    list: () => db.read<StoredSlots[]>(SLOTS, (store) => store.getAll()),
    get: async (vaultId: string): Promise<DeviceSlots | undefined> => {
        const { vaultId: _, ...slots } =
            (await db.read<StoredSlots | undefined>(SLOTS, (store) =>
                store.get(vaultId),
            )) ?? {}
        return isEmpty(slots) ? undefined : slots
    },
    put: (vaultId: string, slots: DeviceSlots) =>
        db.write(SLOTS, (store) => {
            if (isEmpty(slots)) store.delete(vaultId)
            else store.put({ ...slots, vaultId })
        }),
    /** Reads and writes one vault's slots in a single transaction, so two pages never overwrite each other's change.
     *  `change` returns the new slots; empty ones delete the record. */
    update: (vaultId: string, change: (slots: DeviceSlots) => DeviceSlots) =>
        db.write(SLOTS, (store) => {
            const request = store.get(vaultId)
            request.onsuccess = () => {
                const { vaultId: _, ...slots } = (request.result ??
                    {}) as StoredSlots
                const next = change(slots)
                if (isEmpty(next)) store.delete(vaultId)
                else store.put({ ...next, vaultId })
            }
        }),
    remove: (vaultId: string) =>
        db.write(SLOTS, (store) => store.delete(vaultId)),
}
