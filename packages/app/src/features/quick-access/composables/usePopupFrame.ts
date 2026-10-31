import type { SemanticColor } from '@so/ui'
import { computed } from 'vue'

import { usePlatform } from '#core'
import { type SyncState, useSyncStatus } from '#features/backups'
import { useVaultSession } from '#features/vault'

const VIEW = { unlocked: 'accounts', locked: 'locked', new: 'setup' } as const

const DOT: Record<SyncState, SemanticColor> = {
    synced: 'success',
    syncing: 'accent',
    error: 'danger',
    offline: 'neutral',
}

/** The popup's chrome: which screen the vault session allows, and the header's actions. */
export function usePopupFrame() {
    const session = useVaultSession()
    void session.load()
    const platform = usePlatform()
    // The popup runs no sync: it shows what the app page left.
    const status = useSyncStatus()

    return {
        view: computed(() => VIEW[session.state]),
        unlocked: computed(() => session.state === 'unlocked'),
        /** A synced vault's state as a dot; null for one on this device only. */
        syncDot: computed(() =>
            status.value && session.state === 'unlocked'
                ? { color: DOT[status.value.state], label: status.value.label }
                : null,
        ),
        lock: session.lock,
        openApp: (path = '/') => platform.openApp?.(path),
    }
}
