import {
    openSecret,
    restampEdited,
    type SealedRecord,
    type StoredVault,
    type VaultFile,
    type VaultKey,
    type VaultSlots,
    writeRecords,
} from '@so/core'
import { withFileRecovery } from '../services/openVault'
import { restoredRecords } from '../services/restoredRecords'
import {
    openContents,
    type VaultContents,
    withChanges,
} from '../services/vaultContents'
import type { OpenState } from './openState'
import type { vaultFiles } from './vaultFiles'

/** The session's records half: writes in the one queue, the open vault's file and records as they stand, one secret
 *  opened on demand, and the key for what needs it outside the queue. */
export function vaultRecords(
    files: ReturnType<typeof vaultFiles>,
    { opened, recordKeys, contentsOf, epoch }: OpenState,
) {
    const { serial, get: storedVault, save } = files

    /** Writes the records `change` returns to the vault open now; it runs in the queue on the latest records, so changes to one record never overwrite each other. */
    function transact(
        change: (
            contents: VaultContents,
            key: VaultKey,
        ) => Promise<readonly SealedRecord[]>,
    ): Promise<void> {
        const target = opened.value
        if (!target) return Promise.resolve()
        return serial(async () => {
            const vault = storedVault(target.vault.id)
            if (!vault) return
            // Still open, its key may have taken another recovery half from a merge queued before.
            const key =
                opened.value?.vault.id === vault.id
                    ? opened.value.key
                    : target.key
            const current = await contentsOf(vault, key)
            const changed = await change(current, key)
            if (changed.length === 0) return
            const contents = await withChanges(key, current, changed)
            const file = await writeRecords(key, vault.file, contents.records)
            await save(vault, file, contents)
        })
    }

    /** Makes another copy's records (a backup, an export) the open vault's: each stamped now, the rest tombstoned. */
    async function replaceRecords(records: readonly SealedRecord[]) {
        const restored: string[] = []
        await transact(async (contents, key) => {
            const now = Date.now()
            const changed = restoredRecords(contents.records, records, now)
            restored.push(...changed.map(({ id }) => id))
            return Promise.all(
                changed.map((record) =>
                    'deleted' in record
                        ? record
                        : restampEdited(key, record, now),
                ),
            )
        })
        // A locked account may come back sealed under its key of that time.
        for (const id of restored) recordKeys.drop(id)
    }

    /** The open vault's latest file and records, read in the queue: a write accepted before lands first. */
    function snapshot(): Promise<
        { file: VaultFile; contents: VaultContents } | undefined
    > {
        const target = opened.value
        if (!target) return Promise.resolve(undefined)
        return serial(async () => {
            const vault = storedVault(target.vault.id)
            if (!vault) return undefined
            return {
                file: vault.file,
                contents: await contentsOf(vault, target.key),
            }
        })
    }

    /** Opens one record's secret part, with the record's own key when one is held; undefined while no vault is open or it holds no such record. */
    async function secretOf<Secret>(id: string): Promise<Secret | undefined> {
        const target = opened.value
        const record = target?.contents.records.find((found) => found.id === id)
        if (!target || !record || 'deleted' in record) return undefined
        return openSecret<Secret>(target.key, record, recordKeys.get(id))
    }

    /** Runs `use` with the open vault's key and slots, outside the write queue: opening a locked account writes nothing. */
    async function withKey<T>(
        use: (key: VaultKey, slots: VaultSlots) => Promise<T>,
    ): Promise<T | undefined> {
        const target = opened.value
        return target ? use(target.key, target.vault.file.slots) : undefined
    }

    /** Takes in the open vault as stored, before a write and at `refresh`: a new file opens again with the held key, and
     *  the held keys of records whose secret changed drop (an account password set, changed or removed elsewhere seals it
     *  anew). `gone`: removed; `unreadable`: the held key no longer opens the file. */
    async function follow(
        stored: StoredVault | undefined,
    ): Promise<'followed' | 'gone' | 'unreadable'> {
        const target = opened.value
        if (!target || stored === target.vault) return 'followed'
        if (!stored) return 'gone'
        const at = epoch()
        const key =
            stored.file.slots.recovery?.publicKey ===
            target.vault.file.slots.recovery?.publicKey
                ? target.key
                : await withFileRecovery(target.key, stored.file)
        let contents = target.contents
        // A rename, a link or a password change keep the records.
        if (stored.file.body !== target.vault.file.body)
            try {
                contents = await openContents(key, stored.file)
            } catch {
                return 'unreadable'
            }
        // A lock or another open meanwhile is newer than this file.
        if (at !== epoch() || opened.value !== target) return 'followed'
        opened.value = { vault: stored, key, contents }
        const secrets = new Map(
            contents.records.map((record) => [
                record.id,
                'deleted' in record ? undefined : record.secret,
            ]),
        )
        for (const record of target.contents.records)
            if (
                !('deleted' in record) &&
                secrets.get(record.id) !== record.secret
            )
                recordKeys.drop(record.id)
        return 'followed'
    }

    return {
        transact,
        replaceRecords,
        snapshot,
        secretOf,
        withKey,
        follow,
    }
}
