import { computed, type Ref, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
    MIN_MASTER_LENGTH,
    passwordStrength,
    reportError,
    type StrengthLevel,
} from '#core'
import { useVaultSession } from '#features/vault'
import { canChangePassword, repeatState } from '../../services/passwordChange'

const STRENGTH_TONES = [
    'neutral',
    'danger',
    'warning',
    'success',
    'success',
] as const satisfies Record<StrengthLevel, string>

export function useChangePassword(open: Ref<boolean>) {
    const { t } = useI18n()
    const session = useVaultSession()
    const current = ref('')
    const next = ref('')
    const repeat = ref('')
    const currentError = ref('')
    // Never resets: the field shakes on every wrong password.
    const failedAttempts = ref(0)
    const done = ref(false)
    const saving = ref(false)

    // The flow restarts when it opens, so the success state survives the exit animation.
    watch(open, (isOpen) => {
        if (!isOpen) return
        current.value = ''
        next.value = ''
        repeat.value = ''
        currentError.value = ''
        done.value = false
    })
    watch(current, () => {
        currentError.value = ''
    })

    const strength = computed(() => passwordStrength(next.value))
    const strengthTone = computed(() => STRENGTH_TONES[strength.value])
    const lengthHint = computed(() =>
        t('At least {count} characters', { count: MIN_MASTER_LENGTH }),
    )
    const strengthLabel = computed(
        () =>
            [
                lengthHint.value,
                t('Weak'),
                t('Okay'),
                t('Strong'),
                t('Very strong'),
            ][strength.value],
    )
    const repeatMatches = computed(
        () => repeatState(next.value, repeat.value) === 'match',
    )
    const repeatError = computed(() =>
        repeatState(next.value, repeat.value) === 'mismatch'
            ? t("Doesn't match")
            : undefined,
    )
    const canSubmit = computed(() =>
        canChangePassword({
            current: current.value,
            next: next.value,
            repeat: repeat.value,
        }),
    )

    async function submit() {
        if (!canSubmit.value || saving.value) return
        saving.value = true
        try {
            if (await session.changePassword(current.value, next.value))
                done.value = true
            else {
                currentError.value = t('Wrong master password')
                failedAttempts.value++
            }
        } catch (error) {
            reportError(error, 'settings-password')
            currentError.value = t("Couldn't save the new password")
        } finally {
            saving.value = false
        }
    }

    return {
        current,
        next,
        repeat,
        currentError,
        failedAttempts,
        done,
        lengthHint,
        strength,
        strengthTone,
        strengthLabel,
        repeatMatches,
        repeatError,
        canSubmit,
        saving,
        submit,
    }
}
