import { useToast } from '@so/ui'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { reportError } from '#core'

import { useVaultSession } from '../stores/useVaultSession'
import { useOnboardingDraft } from './useOnboardingDraft'

export function useSteamAccess() {
    const { t } = useI18n()
    const session = useVaultSession()
    const draft = useOnboardingDraft()
    const router = useRouter()
    const toast = useToast()

    // The browser permission request comes with the extension wiring.
    const granted = ref(false)
    const apiKey = ref('')
    const creating = ref(false)

    function grant() {
        granted.value = true
    }

    /** Both buttons end onboarding: the vault is created here, so leaving the flow earlier stores nothing. */
    async function finish() {
        if (creating.value) return
        // A deep link past the password step has none to create with.
        if (!draft.password) return router.replace('/welcome/password')
        creating.value = true
        try {
            await session.create(draft.name, draft.password)
        } catch (error) {
            reportError(error, 'onboarding')
            toast.add({
                color: 'danger',
                title: t("Couldn't save the vault on this device"),
            })
        } finally {
            creating.value = false
        }
    }

    return { granted, apiKey, creating, grant, finish }
}
