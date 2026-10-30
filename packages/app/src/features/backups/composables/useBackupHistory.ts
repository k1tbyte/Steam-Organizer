import { type Backup, saveBackup } from '@so/core'
import { type AsyncStatus, useToast } from '@so/ui'
import { computed, reactive, ref, toRaw, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { usePageActive } from '#core'
import { useDrive, useDriveProblem } from '#features/drive'
import { tally, useVaultSession } from '#features/vault'

import type { BackupRow } from '../model'
import { useBackupList } from '../stores/useBackupList'
import { useBackupLabels } from './useBackupLabels'
import { useSyncStatus } from './useSyncStatus'

interface Saving {
    at: string
    /** Shown on top once the snapshot is read. */
    backup?: Backup
}

/** The open vault's Drive history, newest first, with Backup now and the inline delete confirmation. */
export function useBackupHistory() {
    const { t } = useI18n()
    const session = useVaultSession()
    const drive = useDrive()
    const { problemOf } = useDriveProblem()
    const toast = useToast()
    const sync = useSyncStatus()
    const labels = useBackupLabels()
    const active = usePageActive()

    const store = useBackupList()
    // Saves in flight by scope: each shows and blocks Backup now only in its own.
    const saving = reactive(new Map<string, Saving>())
    const confirmingId = ref<string | null>(null)
    const savingHere = computed(
        () => store.scope !== null && saving.has(store.scope),
    )

    // A resident page: it lists again when shown, so backups made elsewhere appear.
    watch(
        [() => store.scope, drive.state, active],
        ([current], [previous]) => {
            if (current !== previous) confirmingId.value = null
            if (active.value) void store.load()
        },
        { immediate: true },
    )

    const rows = computed<BackupRow[]>(() => {
        const pending = store.scope
            ? saving.get(store.scope)?.backup
            : undefined
        return [...(pending ? [pending] : []), ...(store.list ?? [])].map(
            (backup, index) => {
                const saving = backup === pending
                const when = labels.whenOf(backup)
                const accounts = labels.accountsOf(backup.accounts)
                return {
                    id: backup.id,
                    title: labels.titleOf(backup),
                    icon: labels.iconOf(backup),
                    meta: `${when} · ${accounts} · ${labels.sizeOf(backup)}`,
                    metaShort: `${when} · ${accounts}`,
                    latest: index === 0 && !saving,
                    saving,
                    confirmingDelete: confirmingId.value === backup.id,
                }
            },
        )
    })

    // A failed refresh outranks the rows it could not confirm: Retry stays in reach.
    const status = computed<AsyncStatus>(() => {
        if (store.failure) return 'error'
        if (rows.value.length) return 'ready'
        return store.list ? 'empty' : 'loading'
    })

    const canBackUp = computed(() => {
        const state = sync.value?.state
        return (
            drive.state.value === 'connected' &&
            state !== 'error' &&
            state !== 'offline' &&
            !savingHere.value
        )
    })

    function fail(title: string, error: unknown) {
        toast.add({
            color: 'danger',
            title,
            description: problemOf(error).description,
        })
    }

    async function backUp() {
        const at = store.scope
        if (!canBackUp.value || !at) return
        const op: Saving = { at }
        saving.set(at, op)
        try {
            await save(op)
        } catch (error) {
            fail(t("Couldn't back up"), error)
        } finally {
            if (toRaw(saving.get(at)) === op) saving.delete(at)
        }
    }

    async function save(op: Saving) {
        const snapshot = await session.snapshot()
        const vault = session.vault
        // The queue drained into another vault or Google account: this backup is no longer theirs.
        if (
            !snapshot ||
            store.scope !== op.at ||
            vault?.id !== snapshot.file.id
        )
            return
        const meta = {
            vaultName: vault.name,
            kind: 'manual' as const,
            accounts: tally(snapshot.contents).accounts,
        }
        // Through the map's proxy, so the row shows.
        const entry = saving.get(op.at)
        if (entry)
            entry.backup = {
                ...meta,
                id: 'saving',
                vaultId: vault.id,
                createdAt: Date.now(),
                sizeBytes: JSON.stringify(snapshot.file).length,
            }
        const saved = await drive.run((api) =>
            saveBackup(api, snapshot.file, meta),
        )
        store.added(op.at, saved)
    }

    async function remove(id: string) {
        confirmingId.value = null
        await store
            .remove(id)
            .catch((error) => fail(t("Couldn't delete the backup"), error))
    }

    return {
        backups: computed(() => store.list),
        rows,
        status,
        failure: computed(() => store.failure && problemOf(store.failure)),
        count: computed(() => store.list && String(store.list.length)),
        saving: savingHere,
        canBackUp,
        backUp,
        retry: store.load,
        askDelete: (id: string) => {
            confirmingId.value = id
        },
        cancelDelete: () => {
            confirmingId.value = null
        },
        remove,
    }
}
