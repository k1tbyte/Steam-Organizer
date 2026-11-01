import { computed, type Ref, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { reportError, useCloseOnSuccess } from '#core'
import { PIN_LENGTH, useVaultSecurity } from '#features/vault'

/** Set or change the PIN: the master password, then 6 digits twice. */
export function useSetPin(open: Ref<boolean>) {
    const { t } = useI18n()
    const security = useVaultSecurity()
    const closeOnSuccess = useCloseOnSuccess(open)
    const password = ref('')
    const pin = ref('')
    const repeat = ref('')
    const passwordError = ref('')
    const repeatError = ref('')
    // Never resets: the fields shake on every refusal.
    const failedAttempts = ref(0)
    const saving = ref(false)

    function clear() {
        password.value = ''
        pin.value = ''
        repeat.value = ''
        passwordError.value = ''
        repeatError.value = ''
    }

    // The flow restarts when it opens, and a saved PIN clears the fields at once.
    watch(open, (isOpen) => {
        if (isOpen) clear()
    })
    watch(password, () => {
        passwordError.value = ''
    })
    watch([pin, repeat], () => {
        repeatError.value = ''
    })

    const complete = computed(
        () =>
            password.value !== '' &&
            pin.value.length === PIN_LENGTH &&
            repeat.value.length === PIN_LENGTH,
    )

    function refuse(message: string, field: Ref<string>) {
        field.value = message
        failedAttempts.value++
    }

    async function submit() {
        if (!complete.value || saving.value) return
        if (pin.value !== repeat.value)
            return refuse(t("PINs don't match"), repeatError)
        saving.value = true
        try {
            await closeOnSuccess(async () => {
                const result = await security.setPin(password.value, pin.value)
                if (result === 'wrong')
                    refuse(t('Wrong master password'), passwordError)
                else if (result === 'failed')
                    passwordError.value = t("Couldn't save the PIN")
                if (result === 'ok') clear()
                return result === 'ok'
            })
        } catch (error) {
            reportError(error, 'settings-pin')
        } finally {
            saving.value = false
        }
    }

    return {
        password,
        pin,
        repeat,
        passwordError,
        repeatError,
        failedAttempts,
        saving,
        complete,
        submit,
        PIN_LENGTH,
        title: computed(() =>
            security.pin === 'off' ? t('Set a PIN') : t('Change PIN'),
        ),
    }
}
