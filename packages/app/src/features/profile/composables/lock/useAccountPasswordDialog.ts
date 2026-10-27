import { useToast } from '@so/ui'
import { computed, ref, type UnwrapNestedRefs, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import {
    passwordStrength,
    reportError,
    STRENGTH_LABELS,
    STRENGTH_TONES,
    useCloseOnSuccess,
    useQueryOverlay,
} from '#core'
import { type Account, useAccountLocks } from '#features/accounts'

/** Change account password: `?account-password`. The current password, or the master password where recovery is on,
 *  proves the change or takes the lock off. Any length goes, as when it was set. */
export function useAccountPasswordDialog(account: () => Account) {
    const { t } = useI18n()
    const toast = useToast()
    const overlay = useQueryOverlay('account-password')
    const closeOnSuccess = useCloseOnSuccess(overlay.open)
    const locks = useAccountLocks()

    const usesMaster = ref(false)
    const current = ref('')
    const next = ref('')
    const repeat = ref('')
    const wrong = ref(false)
    const failedAttempts = ref(0)
    const saving = ref<'change' | 'remove' | null>(null)

    watch(overlay.open, (isOpen) => {
        if (!isOpen) return
        usesMaster.value = false
        current.value = ''
        next.value = ''
        repeat.value = ''
        wrong.value = false
    })
    watch([current, usesMaster], () => {
        wrong.value = false
    })

    const recovery = computed(() => account().lock?.recovery === true)
    const level = computed(() => passwordStrength(next.value))
    const repeatMatches = computed(
        () => repeat.value !== '' && repeat.value === next.value,
    )
    const credential = () =>
        usesMaster.value
            ? { master: current.value }
            : { password: current.value }

    function run(kind: 'change' | 'remove', done: string, failed: string) {
        if (current.value === '' || saving.value) return
        saving.value = kind
        const id = account().id
        return closeOnSuccess(async () => {
            try {
                const accepted =
                    kind === 'change'
                        ? await locks.changePassword(
                              id,
                              credential(),
                              next.value,
                          )
                        : await locks.removeLock(id, credential())
                if (!accepted) {
                    wrong.value = true
                    failedAttempts.value++
                    return false
                }
                toast.add({ color: 'success', title: done })
                return true
            } catch (error) {
                reportError(error, 'account-lock')
                toast.add({ color: 'danger', title: failed })
                return false
            } finally {
                saving.value = null
            }
        })
    }

    return {
        open: overlay.open,
        show: overlay.show,
        recovery,
        usesMaster,
        current,
        next,
        repeat,
        failedAttempts,
        saving,
        currentPlaceholder: computed(() =>
            usesMaster.value ? t('Master password') : t('Account password'),
        ),
        currentError: computed(() =>
            wrong.value ? t('Wrong password') : undefined,
        ),
        switchLabel: computed(() =>
            usesMaster.value
                ? t('Use account password')
                : t('Use master password'),
        ),
        strength: computed(() => ({
            level: level.value,
            tone: STRENGTH_TONES[level.value],
            // Any length goes: the master password's minimum is no fault here.
            label: level.value === 0 ? '' : t(STRENGTH_LABELS[level.value]),
        })),
        repeatMatches,
        repeatError: computed(() =>
            repeat.value !== '' && !repeatMatches.value
                ? t("Doesn't match")
                : undefined,
        ),
        note: computed(() =>
            recovery.value
                ? t(
                      'Only this account uses it. The master password still opens it.',
                  )
                : t(
                      "Only this account uses it. Recovery is off: forget it and its secrets can't be restored.",
                  ),
        ),
        canChange: computed(
            () =>
                current.value !== '' &&
                repeatMatches.value &&
                saving.value === null,
        ),
        canRemove: computed(
            () => current.value !== '' && saving.value === null,
        ),
        switchMode() {
            usesMaster.value = !usesMaster.value
            current.value = ''
        },
        change: () =>
            run(
                'change',
                t('Account password changed'),
                t("Couldn't change the password"),
            ),
        remove: () =>
            run(
                'remove',
                t('Account unlocked for good'),
                t("Couldn't remove the lock"),
            ),
    }
}
export type AccountPasswordDialogState = UnwrapNestedRefs<
    ReturnType<typeof useAccountPasswordDialog>
>
