import { computed, onScopeDispose, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { formatAgo } from '#core'
import { useDrive } from '#features/drive'
import { useVaultSession } from '#features/vault'

import type { SyncState } from '../model'
import { useVaultSync } from '../stores/useVaultSync'

const MINUTE_MS = 60_000

// One clock for every status line: the age moves once a minute.
const now = shallowRef(Date.now())
let readers = 0
let clock: ReturnType<typeof setInterval> | undefined

function useMinuteClock() {
    if (readers++ === 0) {
        now.value = Date.now()
        clock = setInterval(() => {
            now.value = Date.now()
        }, MINUTE_MS)
    }
    onScopeDispose(() => {
        if (--readers === 0) clearInterval(clock)
    })
    return now
}

/** The open vault's Drive sync as the status line shows it; undefined for a vault on this device only. */
export function useSyncStatus() {
    const { t } = useI18n()
    const drive = useDrive()
    const session = useVaultSession()
    const engine = useVaultSync()
    const minute = useMinuteClock()

    const labels = computed<Record<SyncState, string>>(() => ({
        synced: t('Synced'),
        syncing: t('Syncing…'),
        error: t('Sync failed'),
        offline: t('Offline'),
    }))
    const errors = computed(() => ({
        expired: t('Sign-in expired'),
        disconnected: t('Not connected'),
        failed: t('Sync failed'),
    }))

    // A sign-in that needs the user, or no network, outranks what the last sync said.
    const state = computed<SyncState | undefined>(() => {
        if (!session.vault?.sync) return undefined
        switch (drive.state.value) {
            case 'offline':
                return 'offline'
            case 'expired':
            case 'disconnected':
                return 'error'
        }
        if (engine.running) return 'syncing'
        return engine.failure ? 'error' : 'synced'
    })

    const age = computed(() => {
        const syncedAt = session.vault?.sync?.syncedAt
        if (syncedAt == null) return ''
        return formatAgo(syncedAt, minute.value) ?? t('just now')
    })

    // Why it is `error`: the sign-in, no Google account, or the last run (Retry may help).
    const cause = computed(() => {
        if (state.value !== 'error') return undefined
        const connection = drive.state.value
        return connection === 'expired' || connection === 'disconnected'
            ? connection
            : 'failed'
    })

    return computed(() => {
        const current = state.value
        if (current === undefined) return undefined
        return {
            state: current,
            label: cause.value
                ? errors.value[cause.value]
                : labels.value[current],
            // Only a good sync has an age worth showing.
            age: current === 'synced' ? age.value : '',
            cause: cause.value,
        }
    })
}
