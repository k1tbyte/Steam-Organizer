import type { SecretSlot, StoredVault } from '@so/core'

import { reportError } from '#core'

import type { UnlockResult } from '../model'
import { deviceSlotOf } from '../services/device/deviceSlots'
import {
    keepsSession,
    readSecuritySettings,
} from '../services/device/lockPolicy'
import type { keptSession } from './keptSession'
import type { OpenState } from './openState'
import type { vaultFiles } from './vaultFiles'

/** What only the session does: the restore calls it, and never holds the session's state itself. */
export interface RestoreActions {
    lastVaultId: () => string | undefined
    openRestored: (
        vault: StoredVault,
        slot: SecretSlot,
    ) => Promise<UnlockResult>
    open: (keep: boolean) => void
    lockLocal: () => void
}

/** Restores a kept session (at `load()`, and when another page unlocks) and follows the kept entry: its removal by
 *  another page locks this one. */
export function keptRestore(
    kept: ReturnType<typeof keptSession>,
    files: ReturnType<typeof vaultFiles>,
    { opened, unlocked, epoch }: OpenState,
    actions: RestoreActions,
) {
    const openedId = () => opened.value?.vault.id

    async function restore(stale = false) {
        if (unlocked.value) return
        const at = epoch()
        // Another page's unlock may be of a vault, or a file, this page has not seen; an open vault keeps its list.
        if (stale && !opened.value) await files.refresh()
        const vaultIds = (files.list.value ?? []).map(({ id }) => id)
        const found = await kept.find(vaultIds, actions.lastVaultId())
        const vault = found && files.get(found.vaultId)
        if (!found || !vault || unlocked.value || at !== epoch()) return
        let result: UnlockResult = 'unreadable'
        try {
            result = await actions.openRestored(
                vault,
                await deviceSlotOf(found.sealed),
            )
        } catch (error) {
            reportError(error, 'vault-session')
        }
        if (result === 'opened' && at === epoch() && openedId()) {
            // Another page may have locked meanwhile, and maybe opened another vault.
            if (!(await kept.still(found))) {
                actions.lockLocal()
                return restore(true)
            }
            return actions.open(found.onDisk)
        }
        // A lock or another unlock came first: that one's entry stays.
        if (!unlocked.value && at === epoch()) await kept.drop(found.vaultId)
    }

    // The event may be older than the entry, so the entry is read again.
    async function follow() {
        const entry = await kept.read()
        if (!entry) {
            // Immediately keeps none: its removal is not another page's lock.
            if (unlocked.value && keepsSession(readSecuritySettings()))
                actions.lockLocal()
            return
        }
        if (!unlocked.value) return restore(true)
        if (entry.vault !== openedId()) {
            actions.lockLocal()
            return restore(true)
        }
    }

    return { restore, follow }
}
