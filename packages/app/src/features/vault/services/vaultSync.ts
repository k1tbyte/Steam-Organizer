import {
    importRecovery,
    type LiveRecord,
    mergeRecords,
    newerSlots,
    readAccount,
    readRecords,
    rekeyTies,
    type StoredVault,
    UnsupportedVaultError,
    updateData,
    type VaultFile,
    type VaultKey,
    type VaultSync,
    writeRecords,
} from '@so/core'

import type { SyncReceipt } from '../model'
import { type VaultContents, withChanges } from './vaultContents'

/** Linked, nothing pushed yet: the first sync pushes the whole vault, or merges it into a copy Drive has. */
export const FIRST_PUSH: VaultSync = {
    account: null,
    copyId: null,
    version: null,
    revision: -1,
    syncedAt: null,
}

/** A new link to Drive, `FIRST_PUSH` unless it starts at a copy. */
export const newLink = (
    sync: Omit<VaultSync, 'linkId'> = FIRST_PUSH,
): VaultSync => ({ ...sync, linkId: crypto.randomUUID() })

/** A vault new on this device, at revision 0; `sync` links it to Drive. */
export const newVault = (
    name: string,
    file: VaultFile,
    sync?: VaultSync,
): StoredVault => ({
    id: file.id,
    name,
    home: 'device',
    file,
    revision: 0,
    ...(sync && { sync }),
})

/** A linked vault whose file changed since the copy last took it. */
export const pendingIn = (vault: StoredVault) =>
    vault.sync !== undefined && (vault.revision ?? 0) !== vault.sync.revision

export const receiptOf = (vault: StoredVault): SyncReceipt => ({
    vaultId: vault.id,
    revision: vault.revision ?? 0,
    link: {
        account: vault.sync?.account ?? null,
        copyId: vault.sync?.copyId ?? null,
        version: vault.sync?.version ?? null,
    },
    linkId: vault.sync?.linkId,
})

export interface CopyMerge {
    /** The file and records to store, and the key for its slots; null while this device's side is unchanged. */
    changed: { file: VaultFile; contents: VaultContents; key: VaultKey } | null
    /** Records taken from the copy or purged: a locked account may come back sealed under another key, or be gone. */
    taken: string[]
    /** The copy lacks something: a record, the later slots, a rekey or a change not pushed yet. */
    push: boolean
}

/** The accounts sharing an order key, resealed with new ones: `order` is public data, so a locked account rekeys without
 *  its secret. Both stamps stay, so a deletion or move made meanwhile wins; a tie the copy brings back rekeys again. */
async function rekeyedTies(
    key: VaultKey,
    contents: VaultContents,
): Promise<LiveRecord[]> {
    const accounts = []
    for (const [id, value] of contents.data) {
        const account = readAccount(value)
        if (account) accounts.push({ id, order: account.order })
    }
    const keys = rekeyTies(accounts)
    const rekeyed: LiveRecord[] = []
    for (const record of contents.records) {
        const order = keys.get(record.id)
        if (order === undefined || 'deleted' in record) continue
        const data = contents.data.get(record.id) as object
        rekeyed.push(
            await updateData(key, record, { ...data, order }, record.updatedAt),
        )
    }
    return rekeyed
}

/** Merges Drive's copy into the vault's file, read as `current`, at `now`: tombstones older than the TTL are purged
 *  and accounts left with a tied order key rekeyed. A copy of another vault, or one the key can't open, throws. */
export async function mergeCopyInto(
    key: VaultKey,
    vault: StoredVault,
    current: VaultContents,
    copy: VaultFile,
    now = Date.now(),
): Promise<CopyMerge> {
    if (copy.id !== vault.id) throw new UnsupportedVaultError()
    const remote = await readRecords(key, copy)
    const { toLocal, purged, toRemote } = await mergeRecords(
        key,
        current.records,
        remote,
        now,
    )
    let contents = current
    if (toLocal.length > 0 || purged.length > 0)
        contents = await withChanges(key, current, toLocal, purged)
    const rekeyed = await rekeyedTies(key, contents)
    if (rekeyed.length > 0) contents = await withChanges(key, contents, rekeyed)
    const local = vault.file.slots
    const slots = newerSlots(local, copy.slots)
    const push =
        toRemote ||
        rekeyed.length > 0 ||
        (local.changedAt ?? 0) > (copy.slots.changedAt ?? 0) ||
        pendingIn(vault)
    const taken = [...toLocal.map(({ id }) => id), ...purged]
    if (contents === current && slots === local)
        return { changed: null, taken, push }
    const file = await writeRecords(
        key,
        { ...vault.file, slots },
        contents.records,
    )
    // Two devices that each added a recovery slot hold different pairs: new account locks seal to the one kept.
    const recovery = slots.recovery
    const rekeyedKey =
        recovery && recovery.publicKey !== local.recovery?.publicKey
            ? { ...key, recovery: await importRecovery(recovery) }
            : key
    return { changed: { file, contents, key: rekeyedKey }, taken, push }
}
