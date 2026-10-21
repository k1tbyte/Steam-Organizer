import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import {
    MIN_MASTER_LENGTH,
    passwordStrength,
} from '../services/passwordStrength'

const TONES = ['neutral', 'danger', 'warning', 'success', 'success'] as const

export function useMasterPassword() {
    const { t } = useI18n()
    const router = useRouter()

    const password = ref('')
    const repeat = ref('')
    const acknowledged = ref(false)

    const strength = computed(() => {
        const level = passwordStrength(password.value)
        const labels = [
            t('At least 8 characters'),
            t('Weak'),
            t('Okay'),
            t('Strong'),
            t('Very strong'),
        ]
        return { level, tone: TONES[level], label: labels[level] }
    })

    const repeating = computed(() => repeat.value !== '')
    const matches = computed(
        () => repeating.value && repeat.value === password.value,
    )
    const mismatches = computed(() => repeating.value && !matches.value)

    const canCreate = computed(
        () =>
            password.value.length >= MIN_MASTER_LENGTH &&
            matches.value &&
            acknowledged.value,
    )

    function create() {
        // The vault itself is created when storage is wired; the demo moves on.
        if (canCreate.value) void router.push('/welcome/steam')
    }

    return {
        password,
        repeat,
        acknowledged,
        strength,
        matches,
        mismatches,
        canCreate,
        create,
    }
}
