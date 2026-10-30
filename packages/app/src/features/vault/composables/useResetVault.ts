import { DriveError, listBackups } from '@so/core'
import { useToast } from '@so/ui'
import { computed, type Ref, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { reportError } from '#core'
import { useDrive, useDriveProblem } from '#features/drive'

import { tally } from '../services/vaultContents'
import { canContinueReset, RESET_STEPS } from '../services/vaultReset'
import { useVaultSession } from '../stores/useVaultSession'

interface Problem {
    title: string
    description?: string
}

/** Reset for a lost master password: the open vault from Settings, or a locked one from the unlock screen.
 *  The flow is bound to an action in flight, so its steps are local state, not a URL overlay. */
export function useResetVault(
    open: Ref<boolean>,
    vault: Ref<{ id: string; name: string } | undefined>,
) {
    const { t } = useI18n()
    const session = useVaultSession()
    const drive = useDrive()
    const { problemOf } = useDriveProblem()
    const toast = useToast()

    const step = ref(1)
    const alsoDeleteBackups = ref(true)
    const typedName = ref('')
    const backupIds = shallowRef<string[]>()
    const backupsUnknown = ref(false)
    const resetting = ref(false)
    const problem = shallowRef<Problem | null>(null)
    // A list asked for an earlier opening never lands.
    let request = 0

    async function loadBackups(vaultId: string) {
        const attempt = ++request
        try {
            const found = await drive.run((api) => listBackups(api, vaultId))
            if (attempt === request) backupIds.value = found.map(({ id }) => id)
        } catch (error) {
            if (attempt !== request) return
            if (!(error instanceof DriveError)) reportError(error, 'vault')
            backupsUnknown.value = true
        }
    }

    // The flow restarts when it opens, so it survives the exit animation; a lazy dialog mounts already open.
    watch(
        open,
        (isOpen) => {
            if (!isOpen) return
            step.value = 1
            alsoDeleteBackups.value = true
            typedName.value = ''
            problem.value = null
            backupIds.value = undefined
            backupsUnknown.value = false
            request++
            const id = vault.value?.id
            if (id && drive.state.value !== 'disconnected') void loadBackups(id)
        },
        { immediate: true },
    )

    const vaultName = computed(() => vault.value?.name ?? '')
    // Known only for the open vault: a locked one can't be read.
    const counts = computed(() =>
        vault.value && session.vault?.id === vault.value.id
            ? tally(session.contents)
            : null,
    )
    const backupCount = computed(() => backupIds.value?.length ?? 0)
    const hasBackups = computed(() => backupCount.value > 0)

    const canContinue = computed(() =>
        canContinueReset(step.value, typedName.value, vaultName.value),
    )
    const isLastStep = computed(() => step.value === RESET_STEPS)

    const lastStepSummary = computed(() => {
        if (!hasBackups.value) return t('Deletes the vault on this device.')
        return alsoDeleteBackups.value
            ? t(
                  'Deletes the vault on this device and its {count} backups in Google Drive.',
                  { count: backupCount.value },
              )
            : t(
                  'Deletes the vault on this device. Its {count} backups in Google Drive stay.',
                  { count: backupCount.value },
              )
    })

    function next() {
        if (!canContinue.value || isLastStep.value) return
        // Backups listed after step 1 were never offered, so they are never deleted.
        if (step.value === 1) request++
        step.value++
    }

    function back() {
        step.value = Math.max(1, step.value - 1)
    }

    const removeBackup = (id: string) =>
        drive
            .run((api) => api.remove(id))
            .catch((error) => {
                if (
                    !(error instanceof DriveError && error.kind === 'not-found')
                )
                    throw error
            })

    /** Backups first: one that fails keeps the vault here, so the hold can be tried again. */
    async function reset() {
        const id = vault.value?.id
        if (!id || resetting.value) return
        resetting.value = true
        problem.value = null
        try {
            if (hasBackups.value && alsoDeleteBackups.value)
                for (const backup of backupIds.value ?? [])
                    await removeBackup(backup)
            await session.remove(id)
        } catch (error) {
            if (error instanceof DriveError)
                problem.value = {
                    title: t("Couldn't delete the backups from Google Drive"),
                    description: problemOf(error).description,
                }
            else {
                reportError(error, 'vault', { vault: id })
                problem.value = {
                    title: t("Couldn't delete the vault on this device"),
                }
            }
            return
        } finally {
            resetting.value = false
        }
        // The guard has the page: Welcome when no vault is left, else Unlock.
        open.value = false
        toast.add({
            color: 'success',
            title: t('Vault reset'),
            description: t('Everything was deleted.'),
        })
    }

    return {
        step,
        steps: RESET_STEPS,
        alsoDeleteBackups,
        typedName,
        vaultName,
        accountsLabel: computed(() =>
            counts.value
                ? t(
                      '{count} account with logins, passwords, linked services and notes | {count} accounts with logins, passwords, linked services and notes',
                      counts.value.accounts,
                  )
                : t(
                      'Every account in it, with logins, passwords, linked services and notes',
                  ),
        ),
        // Null once the vault is known to hold none.
        authenticatorsLabel: computed(() => {
            if (!counts.value) return t('Its Steam Guard authenticators')
            const count = counts.value.authenticators
            return count
                ? t(
                      '{count} Steam Guard authenticator | {count} Steam Guard authenticators',
                      count,
                  )
                : null
        }),
        backupCount,
        hasBackups,
        backupsUnknown,
        nameMatches: computed(() =>
            canContinueReset(2, typedName.value, vaultName.value),
        ),
        canContinue,
        hasBack: computed(() => step.value > 1),
        isLastStep,
        lastStepSummary,
        resetting,
        problem,
        next,
        back,
        reset,
    }
}
