import type { AccountCredential } from '@so/core'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import type { LockInfo } from '../../model'

/** The unlock form of a locked account: its own password first, a link switches to the master password.
 *  `accepts` opens the account with the credential and resolves to false when it is wrong. */
export function useUnlockForm(
    lock: () => LockInfo | null | undefined,
    accepts: (credential: AccountCredential) => Promise<boolean>,
) {
    const { t } = useI18n()
    const usesMaster = ref(false)
    const password = ref('')
    const error = ref<'blank' | 'wrong' | null>(null)
    const busy = ref(false)

    function reset() {
        usesMaster.value = false
        password.value = ''
        error.value = null
    }

    return {
        usesMaster,
        password,
        busy,
        /** The master password was asked for on an account that has recovery off: its secrets cannot be restored. */
        recoveryOff: computed(
            () => usesMaster.value && lock()?.recovery === false,
        ),
        note: computed(() =>
            usesMaster.value
                ? t('The master password opens any locked account.')
                : t('Enter the password set for this account.'),
        ),
        placeholder: computed(() =>
            usesMaster.value ? t('Master password') : t('Account password'),
        ),
        switchLabel: computed(() =>
            usesMaster.value
                ? t('Use account password')
                : t('Forgot it? Use master password'),
        ),
        error: computed(() => {
            if (error.value === 'blank')
                return usesMaster.value
                    ? t('Enter the master password')
                    : t('Enter the account password')
            return error.value === 'wrong' ? t('Wrong password') : ''
        }),
        clearError: () => {
            error.value = null
        },
        switchMode: () => {
            const master = !usesMaster.value
            reset()
            usesMaster.value = master
        },
        reset,
        /** Resolves to true once the account opened; the form is clean again then. */
        async submit() {
            const entered = password.value
            if (entered === '') {
                error.value = 'blank'
                return false
            }
            if (busy.value) return false
            busy.value = true
            try {
                const accepted = await accepts(
                    usesMaster.value
                        ? { master: entered }
                        : { password: entered },
                )
                error.value = accepted ? null : 'wrong'
                if (accepted) reset()
                return accepted
            } finally {
                busy.value = false
            }
        },
    }
}
