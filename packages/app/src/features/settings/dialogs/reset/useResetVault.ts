import { computed, type Ref, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { useBackupsInfo } from '../../composables/sources/useBackupsInfo'
import { useVaultInfo } from '../../composables/sources/useVaultInfo'
import { canContinueReset, RESET_STEPS } from '../../services/vaultReset'

/** The reset flow is bound to an action in flight, so its steps are local state, not a URL overlay. */
export function useResetVault(open: Ref<boolean>) {
    const { t } = useI18n()
    const vault = useVaultInfo()
    const backups = useBackupsInfo()

    const step = ref(1)
    const alsoDeleteBackups = ref(true)
    const typedName = ref('')
    const done = ref(false)

    // The flow restarts when it opens, so the done state survives the exit animation.
    watch(open, (isOpen) => {
        if (!isOpen) return
        step.value = 1
        alsoDeleteBackups.value = true
        typedName.value = ''
        done.value = false
    })

    const vaultName = computed(() => vault.value?.name ?? '')
    const accounts = computed(() => vault.value?.accounts ?? 0)
    const authenticators = computed(() => vault.value?.authenticators ?? 0)
    const backupCount = computed(() => backups.value?.count ?? 0)
    const hasBackups = computed(() => backupCount.value > 0)
    const hasAuthenticators = computed(() => authenticators.value > 0)

    const nameMatches = computed(
        () =>
            vaultName.value !== '' &&
            typedName.value.trim() === vaultName.value,
    )
    const canContinue = computed(
        () =>
            vaultName.value !== '' &&
            canContinueReset(step.value, typedName.value, vaultName.value),
    )
    const hasBack = computed(() => step.value > 1)
    const isLastStep = computed(() => step.value === RESET_STEPS)

    const lastStepSummary = computed(() => {
        if (!hasBackups.value || !alsoDeleteBackups.value)
            return hasBackups.value
                ? t(
                      'Deletes the vault on this device. Its {count} backups in Google Drive stay.',
                      { count: backupCount.value },
                  )
                : t('Deletes the vault on this device.')
        return t(
            'Deletes the vault on this device and its {count} backups in Google Drive.',
            { count: backupCount.value },
        )
    })

    function next() {
        if (canContinue.value && !isLastStep.value) step.value++
    }

    function back() {
        step.value = Math.max(1, step.value - 1)
    }

    function reset() {
        // The vault feature deletes the vault and, if chosen, the Drive backups.
        done.value = true
    }

    return {
        step,
        steps: RESET_STEPS,
        alsoDeleteBackups,
        typedName,
        done,
        vaultName,
        accounts,
        authenticators,
        backupCount,
        hasBackups,
        hasAuthenticators,
        nameMatches,
        canContinue,
        hasBack,
        isLastStep,
        lastStepSummary,
        next,
        back,
        reset,
    }
}
