import type { StoredVault } from '@so/core'

import { reportError } from '#core'

import type { UnlockResult } from '../model'
import { deviceSlotOf } from '../services/device/deviceSlots'
import {
    keepsSession,
    readSecuritySettings,
} from '../services/device/lockPolicy'
import type { keptSession } from './keptSession'

/** What the restore reads and does in the session, by closure: it never holds the session's state itself. */
export interface RestoreHost {
    vaultIds: () => string[]
    vault: (id: string) => StoredVault | undefined
    lastVaultId: () => string | undefined
    unlocked: () => boolean
    /** The open vault's id while a key is held. */
    openedId: () => string | undefined
    /** Bumped by every lock: an answer that began before one never opens. */
    epoch: () => number
    /** Takes in the vaults another page stored since this page loaded. */
    refreshVaults: () => Promise<void>
    openRestored: (
        vault: StoredVault,
        slot: Awaited<ReturnType<typeof deviceSlotOf>>,
    ) => Promise<UnlockResult>
    open: (keep: boolean) => void
    lockLocal: () => void
}

/** Restores a kept session (at `load()`, and when another page unlocks) and follows the kept entry: its removal by
 *  another page locks this one. */
export function keptRestore(
    kept: ReturnType<typeof keptSession>,
    host: RestoreHost,
) {
    async function restore(stale = false) {
        if (host.unlocked()) return
        const at = host.epoch()
        // Another page's unlock may be of a vault, or a file, this page has not seen.
        if (stale) await host.refreshVaults()
        const found = await kept.find(host.vaultIds(), host.lastVaultId())
        const vault = found && host.vault(found.vaultId)
        if (!found || !vault || host.unlocked() || at !== host.epoch()) return
        let result: UnlockResult = 'unreadable'
        try {
            result = await host.openRestored(
                vault,
                await deviceSlotOf(found.sealed),
            )
        } catch (error) {
            reportError(error, 'vault-session')
        }
        if (result === 'opened' && at === host.epoch() && host.openedId()) {
            // Another page may have locked meanwhile, which this page did not see locked: its entry is the live signal.
            if (!found.onDisk && !(await kept.read())) return host.lockLocal()
            return host.open(found.onDisk)
        }
        // A lock or another unlock came first: that one's entry stays.
        if (!host.unlocked() && at === host.epoch())
            await kept.drop(found.vaultId)
    }

    // The event may be older than the entry, so the entry is read again.
    async function follow() {
        const entry = await kept.read()
        if (!entry) {
            // Immediately keeps none: its removal is not another page's lock.
            if (host.unlocked() && keepsSession(readSecuritySettings()))
                host.lockLocal()
            return
        }
        if (!host.unlocked()) return restore(true)
        if (entry.vault !== host.openedId()) {
            host.lockLocal()
            return restore(true)
        }
    }

    return { restore, follow }
}
