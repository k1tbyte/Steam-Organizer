import { ref } from 'vue'

import { useVaultSession } from '../stores/useVaultSession'

export function useSteamAccess() {
    const session = useVaultSession()

    // The browser permission request comes with the extension wiring.
    const granted = ref(false)
    const apiKey = ref('')

    function grant() {
        granted.value = true
    }

    /** Both buttons end onboarding: the vault opens with or without Steam access. */
    function finish() {
        session.open()
    }

    return { granted, apiKey, grant, finish }
}
