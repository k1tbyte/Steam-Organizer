import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import {
    MIN_MASTER_LENGTH,
    passwordStrength,
    STRENGTH_LABELS,
    STRENGTH_TONES,
} from '#core'

import { canChangePassword, repeatState } from '../../services/passwordChange'

/** The master password, a new password with its strength and its repeat: a password change and an export's own password. */
export function usePasswordFields() {
    const { t } = useI18n()
    const current = ref('')
    const next = ref('')
    const repeat = ref('')
    const currentError = ref('')
    // Never resets: the field shakes on every wrong password.
    const failedAttempts = ref(0)

    watch(current, () => {
        currentError.value = ''
    })

    const strength = computed(() => passwordStrength(next.value))
    const repeatIs = computed(() => repeatState(next.value, repeat.value))

    return {
        current,
        next,
        repeat,
        currentError,
        failedAttempts,
        lengthHint: computed(() =>
            t('At least {count} characters', { count: MIN_MASTER_LENGTH }),
        ),
        strength,
        strengthTone: computed(() => STRENGTH_TONES[strength.value]),
        strengthLabel: computed(() => t(STRENGTH_LABELS[strength.value])),
        repeatMatches: computed(() => repeatIs.value === 'match'),
        repeatError: computed(() =>
            repeatIs.value === 'mismatch' ? t("Doesn't match") : undefined,
        ),
        complete: computed(() =>
            canChangePassword({
                current: current.value,
                next: next.value,
                repeat: repeat.value,
            }),
        ),
        clear() {
            current.value = ''
            next.value = ''
            repeat.value = ''
            currentError.value = ''
        },
        refuse(message: string) {
            currentError.value = message
            failedAttempts.value++
        },
    }
}

export type PasswordFields = ReturnType<typeof usePasswordFields>
