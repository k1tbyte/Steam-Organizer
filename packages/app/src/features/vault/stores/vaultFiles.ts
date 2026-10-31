import {
    type StoredVault,
    type VaultFile,
    type VaultSync,
    vaultStore,
} from '@so/core'
import { shallowRef } from 'vue'

import { reportError } from '#core'

import type { SyncReceipt } from '../model'
import type { VaultContents } from '../services/vaultContents'
import { FIRST_PUSH, receiptOf } from '../services/vaultSync'

/** The session's storage half: the vaults on this device, the one write queue over them and their Drive links.
 *  `saved` hears every stored change, so the open vault follows its file. */
export function vaultFiles(
    saved: (vault: StoredVault, contents?: VaultContents) => void,
) {
    // Null until `load()`: the autofill entry never calls it, so a Steam page's storage stays untouched.
    const list = shallowRef<StoredVault[] | null>(null)
    let loading: Promise<void> | null = null
    // One writer at a time: each change reads the latest file inside the queue, so none restores an older one.
    let queue: Promise<unknown> = Promise.resolve()
    // Bumped by every link and unlink: a sync read before one never marks the new link synced.
    const linkEpochs = new Map<string, number>()

    function serial<T>(task: () => Promise<T>): Promise<T> {
        const run = queue.then(task)
        queue = run.catch(() => {})
        return run
    }

    // Inside the queue the list holds each vault's latest file: every save lands there, lock or not.
    const get = (id: string) => list.value?.find((item) => item.id === id)

    function remember(vault: StoredVault) {
        list.value = [
            ...(list.value ?? []).filter((item) => item.id !== vault.id),
            vault,
        ]
    }

    // `opening` installs a vault's key before the list shows it: the guard never sees it stored but locked.
    async function persist(
        vault: StoredVault,
        contents?: VaultContents,
        opening?: () => void,
    ) {
        await vaultStore.put(vault)
        opening?.()
        saved(vault, contents)
        remember(vault)
        return vault
    }

    // Every change to the file moves the revision, so a linked vault knows it has one to push; a rename keeps it.
    const withFile = (stored: StoredVault, file: VaultFile): StoredVault => ({
        ...stored,
        file,
        revision: (stored.revision ?? 0) + 1,
    })

    function relink(id: string) {
        linkEpochs.set(id, (linkEpochs.get(id) ?? 0) + 1)
    }

    return {
        list,
        serial,
        get,
        remember,
        persist,
        relink,
        load() {
            loading ??= vaultStore
                .list()
                .catch((error) => {
                    reportError(error, 'vault-session')
                    return []
                })
                .then((found) => {
                    list.value = found
                })
            return loading
        },
        withFile,
        save: (
            stored: StoredVault,
            file: VaultFile,
            contents?: VaultContents,
        ) => persist(withFile(stored, file), contents),
        async remove(id: string) {
            await vaultStore.remove(id)
            list.value = (list.value ?? []).filter((item) => item.id !== id)
        },
        receipt: (vault: StoredVault): SyncReceipt =>
            receiptOf(vault, linkEpochs.get(vault.id) ?? 0),
        /** Links vault `id` to Drive: its next sync pushes it, or merges it into the copy Drive has. */
        link: (id: string | undefined) =>
            serial(async () => {
                const vault = id === undefined ? undefined : get(id)
                if (!vault || vault.sync) return
                relink(vault.id)
                await persist({ ...vault, sync: FIRST_PUSH })
            }),
        unlink: (id: string | undefined) =>
            serial(async () => {
                const vault = id === undefined ? undefined : get(id)
                if (!vault?.sync) return
                relink(vault.id)
                const { sync: _, ...unlinked } = vault
                await persist(unlinked)
            }),
        markSynced: (
            receipt: SyncReceipt,
            at: Pick<VaultSync, 'account' | 'copyId' | 'version'>,
        ) =>
            serial(async () => {
                const vault = get(receipt.vaultId)
                if (
                    !vault?.sync ||
                    (linkEpochs.get(vault.id) ?? 0) !== receipt.linkEpoch
                )
                    return false
                await persist({
                    ...vault,
                    sync: {
                        ...at,
                        revision: receipt.revision,
                        syncedAt: Date.now(),
                    },
                })
                return true
            }),
    }
}
