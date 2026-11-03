import type { VaultFile } from '@so/core'

import type { LockedSnapshot, MergedCopy } from '../model'
import { type OpenVault, tally } from '../services/vaultContents'
import { mergeCopyInto, pendingIn } from '../services/vaultSync'
import type { OpenState } from './openState'
import type { vaultFiles } from './vaultFiles'

/** The session's Drive half: merging the vault with its copy, the checkpoint a lock leaves for the sync, and the link.
 *  The sync engine in `#features/backups` drives it; the session only holds the vault it works on. */
export function vaultSyncSide(
    files: ReturnType<typeof vaultFiles>,
    { opened, recordKeys, contentsOf }: OpenState,
) {
    const { serial, get: storedVault, save } = files
    const lockWatchers = new Set<
        (snapshot: Promise<LockedSnapshot | undefined>) => void
    >()

    /** Hands the watchers the file a lock of `active` leaves with changes still to push. Called after the drafts flushed. */
    function checkpoint(active: OpenVault | null) {
        if (!active?.vault.sync || !lockWatchers.size) return
        const { accounts } = tally(active.contents)
        // Queued after the drafts, so it holds what they wrote; the file is sealed, no key needed.
        const snapshot = serial(async () => {
            const vault = storedVault(active.vault.id)
            return vault && pendingIn(vault)
                ? {
                      file: vault.file,
                      receipt: files.receipt(vault),
                      accounts,
                  }
                : undefined
        })
        for (const watcher of lockWatchers) watcher(snapshot)
    }

    /** Hands `watcher` every lock of a linked vault: the file it left with changes still to push, read after the drafts. */
    function onLocked(
        watcher: (snapshot: Promise<LockedSnapshot | undefined>) => void,
    ) {
        lockWatchers.add(watcher)
        return () => lockWatchers.delete(watcher)
    }

    /** Merges the open linked vault with `copy`, its file on Drive, in the queue on the latest file; without one a pending
     *  file is pushed as is, any other merges with itself, which only purges. A copy the key can't open throws and writes nothing. Undefined without an open linked vault. */
    function mergeCopy(
        copy: VaultFile | null,
    ): Promise<MergedCopy | undefined> {
        const target = opened.value
        if (!target?.vault.sync) return Promise.resolve(undefined)
        const { key } = target
        return serial(async () => {
            const vault = storedVault(target.vault.id)
            if (!vault?.sync) return undefined
            // Pending changes may hold tombstones the copy never saw: purging them would lose the deletion.
            if (!copy && pendingIn(vault))
                return {
                    file: vault.file,
                    receipt: files.receipt(vault),
                    push: true,
                }
            const current = await contentsOf(vault, key)
            const merged = await mergeCopyInto(
                key,
                vault,
                current,
                copy ?? vault.file,
            )
            const stored = merged.changed
                ? await save(
                      vault,
                      merged.changed.file,
                      merged.changed.contents,
                  )
                : vault
            const rekeyed = merged.changed?.key
            if (rekeyed && rekeyed !== key && opened.value?.vault === stored)
                opened.value = { ...opened.value, key: rekeyed }
            // A locked account may come back sealed under another key.
            for (const id of merged.taken) recordKeys.drop(id)
            return {
                file: stored.file,
                receipt: files.receipt(stored),
                push: merged.push,
            }
        })
    }

    return {
        checkpoint,
        onLocked,
        mergeCopy,
        /** Links the open vault to Drive: its next sync pushes it, or merges it into the copy Drive has. */
        link: () => files.link(opened.value?.vault.id),
        /** Keeps vault `id` (the open one by default) on this device only. */
        unlink: (id = opened.value?.vault.id) => files.unlink(id),
        /** Records that Drive's copy holds the file a receipt was read with. Needs no open vault; refused for a vault
         *  removed or linked again since. A write after the receipt stays pending. */
        markSynced: files.markSynced,
    }
}
