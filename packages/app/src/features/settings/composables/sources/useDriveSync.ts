import type { SemanticColor } from '@so/ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { reportError } from '#core'
import { useSyncStatus, useVaultSync } from '#features/backups'
import { useDrive } from '#features/drive'
import { useVaultSession } from '#features/vault'

const COLORS = {
    synced: 'success',
    syncing: 'accent',
    error: 'danger',
    offline: 'neutral',
} as const satisfies Record<string, SemanticColor>

/** The Google identity and the open vault's sync line, with Sync now for a synced vault. */
export function useDriveSync() {
    const { t } = useI18n()
    const drive = useDrive()
    drive.prepare()
    const session = useVaultSession()
    const engine = useVaultSync()
    const status = useSyncStatus()

    const connected = computed(() => drive.state.value !== 'disconnected')

    const statusText = computed(() => {
        switch (drive.state.value) {
            case 'disconnected':
                return t('Not connected')
            case 'expired':
                return t('Sign-in expired')
            case 'offline':
                return t('Offline')
        }
        const current = status.value
        if (current === undefined) return t('Connected')
        if (current.state !== 'synced') return current.label
        return current.age
            ? t('Synced {ago}', { ago: current.age })
            : t('Synced')
    })

    const statusColor = computed<SemanticColor>(() => {
        if (drive.state.value === 'expired') return 'danger'
        if (drive.state.value !== 'connected') return 'neutral'
        return status.value ? COLORS[status.value.state] : 'success'
    })

    return {
        account: drive.account,
        connected,
        expired: computed(() => drive.state.value === 'expired'),
        connecting: drive.connecting,
        canSyncNow: computed(
            () => drive.state.value === 'connected' && !!session.vault?.sync,
        ),
        syncing: computed(() => engine.running),
        statusText,
        statusColor,
        syncNow: () => void engine.syncNow(),
        connect: () =>
            drive.connect().catch((error) => reportError(error, 'drive')),
        disconnect: () =>
            drive.disconnect().catch((error) => reportError(error, 'drive')),
    }
}
