import { type Ref, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { reportError, useCloseOnSuccess } from '#core'
import { useHelloLabel, useVaultSecurity } from '#features/vault'

/** Turns Hello on: the master password first, then the platform's own prompt. */
export function useEnableHello(open: Ref<boolean>) {
    const { t } = useI18n()
    const security = useVaultSecurity()
    const hello = useHelloLabel()
    const closeOnSuccess = useCloseOnSuccess(open)
    const password = ref('')
    const error = ref('')
    // Never resets: the field shakes on every wrong password.
    const failedAttempts = ref(0)
    const saving = ref(false)

    // The flow restarts when it opens, and a turned-on Hello clears the password at once.
    watch(open, (isOpen) => {
        if (!isOpen) return
        password.value = ''
        error.value = ''
    })
    watch(password, () => {
        error.value = ''
    })

    async function submit() {
        if (password.value === '' || saving.value) return
        saving.value = true
        try {
            await closeOnSuccess(async () => {
                const result = await security.enableHello(password.value)
                if (result === 'wrong') {
                    error.value = t('Wrong master password')
                    failedAttempts.value++
                } else if (result === 'cancelled')
                    error.value = t('{hello} was cancelled. Try again.', {
                        hello: hello.value,
                    })
                else if (result === 'unavailable')
                    error.value = t('Not available on this device')
                else if (result === 'failed')
                    error.value = t("Couldn't set up {hello}", {
                        hello: hello.value,
                    })
                if (result === 'ok') password.value = ''
                return result === 'ok'
            })
        } catch (cause) {
            reportError(cause, 'settings-hello')
        } finally {
            saving.value = false
        }
    }

    return { password, error, failedAttempts, saving, submit, label: hello }
}
