import type { SemanticColor } from '@so/ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { reportError } from '#core'
import { useDrive } from '#features/drive'

import { useSettingsStore } from '../../stores/settingsStore'

/** The Google identity and the sync line; the sync itself (Sync now, its age) waits on the backups feature. */
export function useDriveSync() {
    const { t } = useI18n()
    const store = useSettingsStore()
    const drive = useDrive()
    drive.prepare()

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
        if (store.syncing) return t('Syncing…')
        return store.syncedJustNow ? t('Synced just now') : t('Synced')
    })

    const statusColor = computed<SemanticColor>(() => {
        if (drive.state.value === 'expired') return 'danger'
        if (drive.state.value !== 'connected') return 'neutral'
        return store.syncing ? 'accent' : 'success'
    })

    return {
        account: drive.account,
        connected,
        expired: computed(() => drive.state.value === 'expired'),
        connecting: drive.connecting,
        syncing: computed(() => store.syncing),
        statusText,
        statusColor,
        syncNow: store.syncNow,
        connect: () =>
            drive.connect().catch((error) => reportError(error, 'drive')),
        disconnect: () =>
            drive.disconnect().catch((error) => reportError(error, 'drive')),
    }
}
