import { isSteamKey, SETTINGS_ID, withSteamKey } from '@so/core'
import { useToast } from '@so/ui'
import { computed, ref } from 'vue'
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
    const tried = ref(false)
    const creating = ref(false)

    function grant() {
        granted.value = true
    }

    async function saveKey(key: string) {
        try {
            await session.transact(async (contents, vaultKey) => [
                await withSteamKey(
                    vaultKey,
                    contents.records.find((found) => found.id === SETTINGS_ID),
                    key,
                ),
            ])
        } catch (error) {
            reportError(error, 'onboarding')
            toast.add({
                color: 'danger',
                title: t("Couldn't save the API key. Add it in Settings."),
            })
        }
    }

    /** Both buttons end onboarding: the vault is created here, so leaving the flow earlier stores nothing. Skip drops the key. */
    async function finish(keepKey: boolean) {
        if (creating.value) return
        const key = keepKey ? apiKey.value.trim() : ''
        if (key !== '' && !isSteamKey(key)) {
            tried.value = true
            return
        }
        // A deep link past the password step has none to create with.
        if (!draft.password) return router.replace('/welcome/password')
        creating.value = true
        try {
            await session.create(draft.name, draft.password)
            if (key) await saveKey(key)
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

    return {
        granted,
        apiKey,
        keyError: computed(() => {
            const key = apiKey.value.trim()
            return tried.value && key !== '' && !isSteamKey(key)
                ? t('A key is 32 letters and digits')
                : undefined
        }),
        creating,
        grant,
        finish,
    }
}
