import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useMock } from '#core'

import { syncMock } from '../mocks'
import type { SyncState } from '../model'

/** Drive sync state as the status line shows it; waits on the sync service. */
export function useSyncStatus() {
    const { t } = useI18n()
    const snapshot = useMock(() => undefined, syncMock)

    const labels = computed<Record<SyncState, string>>(() => ({
        synced: t('Synced'),
        syncing: t('Syncing…'),
        error: t('Sync failed'),
        offline: t('Offline'),
    }))

    return computed(() => {
        const current = snapshot.value
        if (current === undefined) return undefined
        return {
            state: current.state,
            label: labels.value[current.state],
            // Only a good sync has an age worth showing.
            age: current.state === 'synced' ? current.ago : '',
        }
    })
}
