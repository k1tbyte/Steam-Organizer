import {
    mergeRecords,
    newerSlots,
    readRecords,
    type StoredVault,
    UnsupportedVaultError,
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

export const receiptOf = (
    vault: StoredVault,
    linkEpoch: number,
): SyncReceipt => ({
    vaultId: vault.id,
    revision: vault.revision ?? 0,
    link: {
        account: vault.sync?.account ?? null,
        copyId: vault.sync?.copyId ?? null,
        version: vault.sync?.version ?? null,
    },
    linkEpoch,
})

export interface CopyMerge {
    /** The file and records to store; null while this device's side is unchanged. */
    changed: { file: VaultFile; contents: VaultContents } | null
    /** Records taken from the copy. */
    taken: string[]
    /** The copy lacks something: a record, the later slots or a change not pushed yet. */
    push: boolean
}

/** Merges Drive's copy into the vault's file, read as `current`. A copy of another vault, or one the key can't open, throws. */
export async function mergeCopyInto(
    key: VaultKey,
    vault: StoredVault,
    current: VaultContents,
    copy: VaultFile,
): Promise<CopyMerge> {
    if (copy.id !== vault.id) throw new UnsupportedVaultError()
    const remote = await readRecords(key, copy)
    const { toLocal, toRemote } = await mergeRecords(
        key,
        current.records,
        remote,
    )
    const local = vault.file.slots
    const slots = newerSlots(local, copy.slots)
    const push =
        toRemote ||
        (local.changedAt ?? 0) > (copy.slots.changedAt ?? 0) ||
        pendingIn(vault)
    const taken = toLocal.map(({ id }) => id)
    if (toLocal.length === 0 && slots === local)
        return { changed: null, taken, push }
    const contents = await withChanges(key, current, toLocal)
    const file = await writeRecords(
        key,
        { ...vault.file, slots },
        contents.records,
    )
    return { changed: { file, contents }, taken, push }
}
