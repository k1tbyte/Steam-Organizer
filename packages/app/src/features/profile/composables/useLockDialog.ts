import { computed, ref, type UnwrapNestedRefs, watch } from 'vue'

import { useQueryOverlay } from '#core'

import type { LockScope } from '../model'
import { checkLockForm } from '../services/accountLock'

/** Lock account: `?lock-account`, a window on desktop and a sheet on phones. Confirming is an intent that has no listener yet. */
export function useLockDialog() {
    const overlay = useQueryOverlay('lock-account')

    const password = ref('')
    const repeat = ref('')
    const showPasswords = ref(false)
    const scope = ref<LockScope>('credentials')
    const recovery = ref(true)

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
        matches: computed(() => form.value.matches),
        mismatch: computed(() => form.value.mismatch),
        canLock: computed(() => form.value.canLock),
        lock() {
            if (form.value.canLock) overlay.open.value = false
        },
    }
}
export type LockDialogState = UnwrapNestedRefs<ReturnType<typeof useLockDialog>>
