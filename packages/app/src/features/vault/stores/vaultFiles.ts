import {
    type StoredVault,
    type VaultFile,
    type VaultSync,
    vaultStore,
} from '@so/core'
import { shallowRef } from 'vue'

import { acrossPages, reportError, serialQueue } from '#core'

import type { SyncReceipt } from '../model'
import type { VaultContents } from '../services/vaultContents'
import { newLink, receiptOf } from '../services/vaultSync'

// The lock every page's write turn holds, and the channel it tells the other pages on.
const VAULTS = 'so:vaults'

// Every change to the file moves the revision; a rename or a link keeps it.
const sameStored = (a: StoredVault, b: StoredVault) =>
    (a.revision ?? 0) === (b.revision ?? 0) &&
    a.file.body === b.file.body &&
    a.name === b.name &&
    JSON.stringify(a.sync) === JSON.stringify(b.sync)

/** The session's storage half: the vaults on this device, the one write queue over them and their Drive links.
 *  `saved` hears this page's every stored change; `followOpen` runs once the list took in other pages', before a write. */
export function vaultFiles(
    saved: (vault: StoredVault, contents?: VaultContents) => void,
    followOpen: () => Promise<void>,
) {
    // Null until `load()`: the autofill entry never calls it, so a Steam page's storage stays untouched.
    const list = shallowRef<StoredVault[] | null>(null)
    let loading: Promise<void> | null = null
    const queue = serialQueue()
    let channel: BroadcastChannel | undefined
    // A catch-up waits already: another message needs none of its own.
    let behind = false

    /** One writer across pages: a write holds the lock and first takes in what other pages stored, the open vault too, so
     *  it never writes over a file it has not read. A lock that causes lands first: the work finds its vault gone or closed. */
    const serial = <T>(work: () => Promise<T>) =>
        queue(() =>
            acrossPages(VAULTS, async () => {
                await takeStored()
                await followOpen()
                return work()
            }),
        )

    /** Takes in what other pages stored, then the open vault follows: in this page's queue, outside the lock, so a
     *  read never stalls their writes. */
    const refresh = () =>
        queue(async () => {
            behind = false
            await takeStored()
            await followOpen()
        })

    async function takeStored() {
        if (!list.value) return
        const stored = await vaultStore.list()
        const kept = list.value.filter(({ id }) =>
            stored.some((vault) => vault.id === id),
        )
        if (kept.length < list.value.length) list.value = kept
        for (const vault of stored) {
            const known = get(vault.id)
            if (known && sameStored(known, vault)) continue
            remember(vault)
        }
    }

    function listen() {
        if (channel || typeof BroadcastChannel === 'undefined') return
        channel = new BroadcastChannel(VAULTS)
        channel.onmessage = () => {
            if (behind) return
            behind = true
            refresh().catch((error) => reportError(error, 'vault-session'))
        }
    }

    // Inside a turn the list holds each vault's latest file, other pages' taken in: every save lands there, lock or not.
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
        channel?.postMessage(vault.id)
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

    return {
        list,
        serial,
        get,
        remember,
        persist,
        load() {
            loading ??= vaultStore
                .list()
                .catch((error) => {
                    reportError(error, 'vault-session')
                    return []
                })
                .then((found) => {
                    list.value = found
                    listen()
                })
            return loading
        },
        withFile,
        save: (
            stored: StoredVault,
            file: VaultFile,
            contents?: VaultContents,
        ) => persist(withFile(stored, file), contents),
        /** Takes in what other pages stored and this one may not have heard (a page asleep misses their messages). */
        refresh,
        async remove(id: string) {
            await vaultStore.remove(id)
            channel?.postMessage(id)
            list.value = (list.value ?? []).filter((item) => item.id !== id)
        },
        receipt: (vault: StoredVault): SyncReceipt => receiptOf(vault),
        /** Links vault `id` to Drive: its next sync pushes it, or merges it into the copy Drive has. */
        link: (id: string | undefined) =>
            serial(async () => {
                const vault = id === undefined ? undefined : get(id)
                if (!vault || vault.sync) return
                await persist({ ...vault, sync: newLink() })
            }),
        unlink: (id: string | undefined) =>
            serial(async () => {
                const vault = id === undefined ? undefined : get(id)
                if (!vault?.sync) return
                const { sync: _, ...unlinked } = vault
                await persist(unlinked)
            }),
        markSynced: (
            receipt: SyncReceipt,
            at: Pick<VaultSync, 'account' | 'copyId' | 'version'>,
        ) =>
            serial(async () => {
                const vault = get(receipt.vaultId)
                if (!vault?.sync || vault.sync.linkId !== receipt.linkId)
                    return false
                await persist({
                    ...vault,
                    sync: {
                        ...at,
                        linkId: vault.sync.linkId,
                        revision: receipt.revision,
                        syncedAt: Date.now(),
                    },
                })
                return true
            }),
    }
}
