import type { StoredVault, VaultKey } from '@so/core'
import { ref, shallowRef } from 'vue'

import { type OpenVault, openContents } from '../services/vaultContents'
import { recordKeyring } from './recordKeys'

/** The session's open vault, shared by its halves: the key and records, the keys of opened locked accounts, and the
 *  epoch every close bumps, so an answer that began before one never opens. */
export function openState() {
    // Unwrapped by unlock, kept through the opening animation until `open()`.
    const opened = shallowRef<OpenVault | null>(null)
    const unlocked = ref(false)
    const recordKeys = recordKeyring()
    let epoch = 0

    return {
        opened,
        unlocked,
        recordKeys,
        epoch: () => epoch,
        // A lock meanwhile still lets an accepted change land, on records read again from the file.
        contentsOf: async (vault: StoredVault, key: VaultKey) =>
            opened.value?.vault === vault
                ? opened.value.contents
                : openContents(key, vault.file),
        /** Drops the key and the held record keys; the caller runs what a lock or a removal adds around it. */
        close() {
            if (opened.value || unlocked.value) epoch++
            opened.value = null
            recordKeys.clear()
            unlocked.value = false
        },
    }
}

export type OpenState = ReturnType<typeof openState>
