import type { AsyncStatus } from '@so/ui'
import { useTimer } from '@so/ui/useTimer'
import { computed, ref, watch } from 'vue'

import { useMock } from '#core'

import { historyMock } from '../mocks'
import type { Backup, BackupRow } from '../model'
import { useBackupLabels } from './useBackupLabels'
import { useBackupsVault } from './useBackupsVault'
import { useSyncStatus } from './useSyncStatus'

const SAVE_MS = 1400

/** The Drive history, newest first, with Backup now and the inline delete confirmation. */
export function useBackupHistory() {
    const source = useMock(() => undefined, historyMock)
    const sync = useSyncStatus()
    const { vault, onDevice } = useBackupsVault()
    const labels = useBackupLabels()
    const timer = useTimer()

    const added = ref<Backup[]>([])
    const removed = ref<string[]>([])
    const confirmingId = ref<string | null>(null)
    const saving = ref(false)

    // A new sample starts from its own data.
    watch(source, () => {
        added.value = []
        removed.value = []
        confirmingId.value = null
        saving.value = false
        timer.cancel()
    })

    // A device-only vault has no Drive history, so nothing to list or restore.
    const backups = computed(() => {
        if (source.value === undefined) return undefined
        if (onDevice.value) return []
        return [...added.value, ...source.value].filter(
            ({ id }) => !removed.value.includes(id),
        )
    })

    const rows = computed<BackupRow[]>(() =>
        (backups.value ?? []).map((backup, index) => {
            const isSaving = saving.value && index === 0
            const when = labels.whenOf(backup)
            const accounts = labels.accountsOf(backup.accounts)
            return {
                id: backup.id,
                title: labels.titleOf(backup),
                icon: labels.iconOf(backup),
                meta: `${when} · ${accounts} · ${labels.sizeOf(backup)}`,
                metaShort: `${when} · ${accounts}`,
                latest: index === 0 && !isSaving,
                olderPassword: backup.olderPassword === true,
                saving: isSaving,
                confirmingDelete: confirmingId.value === backup.id,
            }
        }),
    )

    const status = computed<AsyncStatus>(() => {
        if (backups.value === undefined) return 'loading'
        return backups.value.length === 0 ? 'empty' : 'ready'
    })

    const canBackUp = computed(() => {
        const state = sync.value?.state
        return state !== 'error' && state !== 'offline' && !saving.value
    })

    function backUp() {
        if (!canBackUp.value) return
        added.value = [
            {
                id: `new-${Date.now()}`,
                kind: 'manual',
                createdAt: Date.now(),
                accounts: vault.value?.accounts ?? 0,
                sizeBytes: backups.value?.[0]?.sizeBytes ?? 0,
            },
            ...added.value,
        ]
        saving.value = true
        timer.arm(SAVE_MS, () => {
            saving.value = false
        })
    }

    function remove(id: string) {
        removed.value = [...removed.value, id]
        confirmingId.value = null
    }

    return {
        backups,
        rows,
        status,
        count: computed(() => String(rows.value.length)),
        saving,
        canBackUp,
        backUp,
        askDelete: (id: string) => {
            confirmingId.value = id
        },
        cancelDelete: () => {
            confirmingId.value = null
        },
        remove,
    }
}
