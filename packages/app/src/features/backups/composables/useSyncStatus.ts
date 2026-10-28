import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useMock } from '#core'
import { useDrive } from '#features/drive'

import { syncMock } from '../mocks'
import type { SyncState } from '../model'

/** Drive sync state as the status line shows it; the sync itself waits on the sync service. */
export function useSyncStatus() {
    const { t } = useI18n()
    const drive = useDrive()
    const snapshot = useMock(() => undefined, syncMock)

    const labels = computed<Record<SyncState, string>>(() => ({
        synced: t('Synced'),
        syncing: t('Syncing…'),
        error: t('Sync failed'),
        offline: t('Offline'),
    }))

    // A sign-in that needs the user, or no network, outranks what the last sync said.
    const state = computed<SyncState | undefined>(() => {
        if (drive.state.value === 'expired') return 'error'
        if (drive.state.value === 'offline') return 'offline'
        return snapshot.value?.state
    })

    return computed(() => {
        const current = state.value
        if (current === undefined) return undefined
        return {
            state: current,
            label: labels.value[current],
            // Only a good sync has an age worth showing.
            age: current === 'synced' ? (snapshot.value?.ago ?? '') : '',
        }
    })
}
