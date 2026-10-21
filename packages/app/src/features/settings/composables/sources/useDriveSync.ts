import type { SemanticColor } from '@so/ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useMock } from '#core'

import { googleMock } from '../../mocks'
import { useSettingsStore } from '../../stores/settingsStore'

/** Google identity and the sync line; the identity and its age wait on the backups feature's Drive sync. */
export function useDriveSync() {
    const { t } = useI18n()
    const store = useSettingsStore()
    const account = useMock(() => undefined, googleMock)

    const connected = computed(() => store.sync.connected)

    const statusText = computed(() => {
        if (!connected.value) return t('Not connected')
        if (store.syncing) return t('Syncing…')
        if (store.syncedJustNow) return t('Synced just now')
        const minutes = account.value?.syncedMinutesAgo
        return minutes === undefined
            ? t('Synced')
            : t('Synced {minutes} min ago', { minutes })
    })

    const statusColor = computed<SemanticColor>(() => {
        if (!connected.value) return 'neutral'
        return store.syncing ? 'accent' : 'success'
    })

    function connect() {
        store.setSync({ connected: true })
    }

    function disconnect() {
        store.setSync({ connected: false })
    }

    return {
        account,
        connected,
        syncing: computed(() => store.syncing),
        statusText,
        statusColor,
        syncNow: store.syncNow,
        connect,
        disconnect,
    }
}
