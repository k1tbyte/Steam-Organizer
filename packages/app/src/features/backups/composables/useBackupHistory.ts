import { type Backup, DriveError, listBackups, saveBackup } from '@so/core'
import { type AsyncStatus, useToast } from '@so/ui'
import { computed, reactive, ref, shallowRef, toRaw, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { usePageActive } from '#core'
import { type DriveProblem, useDrive, useDriveProblem } from '#features/drive'
import { useVaultSession } from '#features/vault'

import type { BackupRow } from '../model'
import { useBackupLabels } from './useBackupLabels'
import { countAccounts } from './useBackupsVault'
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

    const list = shallowRef<Backup[]>()
    const failure = shallowRef<DriveProblem | null>(null)
    // Saves in flight by scope: each shows and blocks Backup now only in its own.
    const saving = reactive(new Map<string, Saving>())
    // Rows already sent to Drive's bin: a list read meanwhile still has them.
    const deleting = new Set<string>()
    const confirmingId = ref<string | null>(null)
    const vaultId = computed(() => session.vault?.id)
    // The list belongs to one vault on one Google account: an answer for another never lands.
    const scope = computed(() =>
        vaultId.value && drive.account.value
            ? `${vaultId.value} ${drive.account.value.email}`
            : null,
    )
    let request = 0
    const savingHere = computed(
        () => scope.value !== null && saving.has(scope.value),
    )

    async function load() {
        const id = vaultId.value
        if (!id || drive.state.value === 'disconnected') return
        const attempt = ++request
        try {
            const found = await drive.run((api) => listBackups(api, id))
            if (attempt !== request) return
            list.value = found.filter(({ id }) => !deleting.has(id))
            failure.value = null
        } catch (error) {
            if (attempt === request) failure.value = problemOf(error)
        }
    }

    // A resident page: it lists again when shown, so backups made elsewhere appear.
    watch(
        [scope, drive.state, active],
        ([current], [previous]) => {
            if (current !== previous) {
                request++
                list.value = undefined
                failure.value = null
                confirmingId.value = null
            }
            if (active.value) void load()
        },
        { immediate: true },
    )

    const rows = computed<BackupRow[]>(() => {
        const pending = scope.value
            ? saving.get(scope.value)?.backup
            : undefined
        return [...(pending ? [pending] : []), ...(list.value ?? [])].map(
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
        if (failure.value) return 'error'
        if (rows.value.length) return 'ready'
        return list.value ? 'empty' : 'loading'
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
        const at = scope.value
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
            scope.value !== op.at ||
            vault?.id !== snapshot.file.id
        )
            return
        const meta = {
            vaultName: vault.name,
            kind: 'manual' as const,
            accounts: countAccounts(snapshot.contents),
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
        if (scope.value !== op.at) return
        if (!list.value || failure.value) return void load()
        // A list asked for before the save would drop it.
        request++
        list.value = [saved, ...list.value.filter(({ id }) => id !== saved.id)]
    }

    async function remove(id: string) {
        confirmingId.value = null
        const backup = list.value?.find((item) => item.id === id)
        if (!backup) return
        const at = scope.value
        request++
        deleting.add(id)
        list.value = list.value?.filter((item) => item !== backup)
        try {
            await drive.run((api) => api.remove(id))
        } catch (error) {
            if (error instanceof DriveError && error.kind === 'not-found')
                return
            if (scope.value === at && list.value)
                list.value = [...list.value, backup].sort(
                    (a, b) => b.createdAt - a.createdAt,
                )
            fail(t("Couldn't delete the backup"), error)
        } finally {
            // A list read while the delete ran may still hold the row.
            if (scope.value === at) request++
            deleting.delete(id)
        }
    }

    return {
        backups: computed(() => list.value),
        rows,
        status,
        failure,
        count: computed(() => list.value && String(list.value.length)),
        saving: savingHere,
        canBackUp,
        backUp,
        retry: load,
        askDelete: (id: string) => {
            confirmingId.value = id
        },
        cancelDelete: () => {
            confirmingId.value = null
        },
        remove,
    }
}
