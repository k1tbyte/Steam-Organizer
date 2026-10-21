import { useTimer } from '@so/ui/useTimer'
import { computed, type Ref, ref, watch, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'

import { useQueryOverlay } from '#core'

import type { Backup } from '../model'
import { formatDate } from '../services/backupFormat'
import { passwordProblem } from '../services/restorePassword'
import { useBackupLabels } from './useBackupLabels'
import { useBackupsVault } from './useBackupsVault'

const RESTORE_MS = 1100
// Mock: the real check opens the backup with the password.
const DEMO_PASSWORD = 'demo'

type Phase = 'form' | 'busy' | 'done'

/** The restore dialog: `?restore=<backup id>`, the password check for older backups, then busy and done. */
export function useRestoreBackup(backups: Readonly<Ref<Backup[] | undefined>>) {
    const { t } = useI18n()
    const {
        open: isOpen,
        value: backupId,
        show,
        close,
    } = useQueryOverlay('restore')
    const { vault } = useBackupsVault()
    const labels = useBackupLabels()
    const timer = useTimer()

    const password = ref('')
    const problem = ref<string | null>(null)
    const phase = ref<Phase>('form')

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
        timer.cancel()
        password.value = ''
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
            olderPassword: current.olderPassword === true,
            date: formatDate(current.createdAt),
        }
    })

    function submit() {
        const current = backup.value
        if (current === undefined || phase.value !== 'form') return
        if (current.olderPassword) {
            const wrong = passwordProblem(password.value, DEMO_PASSWORD)
            if (wrong !== null) {
                problem.value =
                    wrong === 'blank'
                        ? t('Enter the password this backup was made with')
                        : t('Wrong password for this backup')
                return
            }
        }
        phase.value = 'busy'
        timer.arm(RESTORE_MS, () => {
            phase.value = 'done'
        })
    }

    return {
        open,
        summary,
        vault,
        password,
        problem,
        busy: computed(() => phase.value === 'busy'),
        done: computed(() => phase.value === 'done'),
        show,
        clearProblem: () => {
            problem.value = null
        },
        submit,
        close: () => close(),
    }
}

export type RestoreBackup = ReturnType<typeof useRestoreBackup>
