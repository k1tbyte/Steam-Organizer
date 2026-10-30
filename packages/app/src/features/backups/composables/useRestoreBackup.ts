import {
    type Backup,
    DriveError,
    readBackup,
    readRecords,
    type SealedRecord,
    UnsupportedVaultError,
} from '@so/core'
import {
    computed,
    onScopeDispose,
    type Ref,
    ref,
    shallowRef,
    watch,
    watchEffect,
} from 'vue'
import { useI18n } from 'vue-i18n'

import { reportError, useQueryOverlay } from '#core'
import { useDrive, useDriveProblem } from '#features/drive'
import { useVaultSession } from '#features/vault'

import { formatDate } from '../services/backupFormat'
import { restoredRecords } from '../services/restoredRecords'
import { useBackupLabels } from './useBackupLabels'
import { useBackupsVault } from './useBackupsVault'

type Phase = 'form' | 'busy' | 'done'

interface Problem {
    title: string
    description: string
}

/** The restore dialog: `?restore=<backup id>`, then busy and done. The open vault's key reads its own backups, whatever the password was then. */
export function useRestoreBackup(backups: Readonly<Ref<Backup[] | undefined>>) {
    const { t } = useI18n()
    const {
        open: isOpen,
        value: backupId,
        show,
        close,
    } = useQueryOverlay('restore')
    const session = useVaultSession()
    const drive = useDrive()
    const { problemOf } = useDriveProblem()
    const { vault } = useBackupsVault()
    const labels = useBackupLabels()

    const problem = shallowRef<Problem | null>(null)
    const phase = ref<Phase>('form')
    // Bumped by each opening, each submit and the page going away: an older restore never lands or speaks for this one.
    let attempt = 0
    onScopeDispose(() => {
        attempt++
    })

    const backup = computed(() =>
        backups.value?.find(({ id }) => id === backupId.value),
    )

    // A link to a backup that is not there: nothing to restore, so no dialog.
    watchEffect(() => {
        if (isOpen.value && backups.value && !backup.value) close()
    })

    // A flow starts over when it opens, not when it closes: the exit animation keeps its content.
    watch(isOpen, (opened) => {
        if (!opened) return
        attempt++
        problem.value = null
        phase.value = 'form'
    })

    const open = computed({
        get: () => isOpen.value && backup.value !== undefined,
        set: (value: boolean) => (value ? show() : close()),
    })

    const summary = computed(() => {
        const current = backup.value
        if (current === undefined) return undefined
        return {
            title: labels.titleOf(current),
            icon: labels.iconOf(current),
            when: labels.whenOf(current),
            accounts: current.accounts,
            size: labels.sizeOf(current),
            date: formatDate(current.createdAt),
        }
    })

    function unreadable(error: unknown) {
        if (error instanceof DriveError) return problemOf(error)
        if (!(error instanceof UnsupportedVaultError))
            reportError(error, 'backups')
        return {
            title: t("This backup can't be opened"),
            description: t(
                'It was made by a newer version of the app, or the file is damaged.',
            ),
        }
    }

    async function submit() {
        const current = backup.value
        if (current === undefined || phase.value !== 'form') return
        const mine = ++attempt
        const vaultId = session.vault?.id
        problem.value = null
        phase.value = 'busy'
        const settle = (next: Phase, found: Problem | null = null) => {
            if (mine !== attempt) return
            phase.value = next
            problem.value = found
        }
        let read: SealedRecord[] | undefined
        try {
            const file = await drive.run((api) => readBackup(api, current.id))
            read = await session.withKey((key) => readRecords(key, file))
        } catch (error) {
            return settle('form', unreadable(error))
        }
        // Read under one vault's key, written only into that vault.
        if (!read || mine !== attempt || session.vault?.id !== vaultId)
            return settle('form')
        const backupRecords = read
        const restored: string[] = []
        try {
            await session.transact(async ({ records }) => {
                const changed = restoredRecords(
                    records,
                    backupRecords,
                    Date.now(),
                )
                restored.push(...changed.map(({ id }) => id))
                return changed
            })
        } catch (error) {
            reportError(error, 'backups')
            return settle('form', {
                title: t("Couldn't restore the backup"),
                description: t(
                    'Saving on this device failed; the vault stays as it was.',
                ),
            })
        }
        // A locked account may come back sealed under its key of that time.
        for (const id of restored) session.dropKey(id)
        settle('done')
    }

    return {
        open,
        summary,
        vault,
        problem,
        busy: computed(() => phase.value === 'busy'),
        done: computed(() => phase.value === 'done'),
        show,
        submit,
        close: () => close(),
    }
}

export type RestoreBackup = ReturnType<typeof useRestoreBackup>
