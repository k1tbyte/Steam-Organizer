import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import {
    MIN_MASTER_LENGTH,
    passwordStrength,
    STRENGTH_LABELS,
    STRENGTH_TONES,
} from '#core'

import { useOnboardingDraft } from './useOnboardingDraft'

export function useMasterPassword() {
    const { t } = useI18n()
    const router = useRouter()
    const draft = useOnboardingDraft()

    const password = ref('')
    const repeat = ref('')
    const acknowledged = ref(false)

    const strength = computed(() => {
        const level = passwordStrength(password.value)
        return {
            level,
            tone: STRENGTH_TONES[level],
            label: t(STRENGTH_LABELS[level]),
        }
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
        if (!canCreate.value) return
        draft.password = password.value
        void router.push('/welcome/steam')
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
