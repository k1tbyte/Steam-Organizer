import type { LockScope } from '@so/core'
import { useToast } from '@so/ui'
import { computed, ref, type UnwrapNestedRefs, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { reportError, useCloseOnSuccess, useQueryOverlay } from '#core'
import { useAccountLocks } from '#features/accounts'

import { checkLockForm } from '../../services/accountLock'

/** Lock account: `?lock-account`, a window on desktop and a sheet on phones. The account stays open until the page is left. */
export function useLockDialog(accountId: () => string) {
    const { t } = useI18n()
    const toast = useToast()
    const overlay = useQueryOverlay('lock-account')
    const closeOnSuccess = useCloseOnSuccess(overlay.open)
    const locks = useAccountLocks()

    const password = ref('')
    const repeat = ref('')
    const showPasswords = ref(false)
    const scope = ref<LockScope>('credentials')
    const recovery = ref(true)
    const saving = ref(false)

    // A fresh form on every opening, never on close: the exit animation keeps its content.
    watch(overlay.open, (isOpen) => {
        if (!isOpen) return
        password.value = ''
        repeat.value = ''
        showPasswords.value = false
        scope.value = 'credentials'
        recovery.value = true
    })

    const form = computed(() => checkLockForm(password.value, repeat.value))

    return {
        open: overlay.open,
        show: overlay.show,
        password,
        repeat,
        showPasswords,
        scope,
        recovery,
        saving,
        matches: computed(() => form.value.matches),
        mismatch: computed(() => form.value.mismatch),
        canLock: computed(() => form.value.canLock && !saving.value),
        lock() {
            if (!form.value.canLock || saving.value) return
            saving.value = true
            return closeOnSuccess(async () => {
                try {
                    await locks.setLock(
                        accountId(),
                        password.value,
                        scope.value,
                        recovery.value,
                    )
                    return true
                } catch (error) {
                    reportError(error, 'account-lock')
                    toast.add({
                        color: 'danger',
                        title: t("Couldn't lock the account"),
                    })
                    return false
                } finally {
                    saving.value = false
                }
            })
        },
    }
}
export type LockDialogState = UnwrapNestedRefs<ReturnType<typeof useLockDialog>>
