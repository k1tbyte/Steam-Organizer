import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

import { useMock } from '#core'

import { DEMO_PASSWORD, DEMO_PIN, sessionMock } from '../mocks'
import type { Credential, SessionState } from '../model'

// Stands in for the Windows Hello prompt.
const HELLO_DELAY_MS = 1300

/** Whether a vault is open: the router guard reads `state`, the lock button and unlock flow write it. */
export const useVaultSession = defineStore('vault-session', () => {
    const mocked = useMock(() => undefined, sessionMock)
    // Set by an intent; picking a mock variant in the panel clears it.
    const override = ref<SessionState | null>(null)
    watch(mocked, () => {
        override.value = null
    })

    const state = computed<SessionState>(
        () => override.value ?? mocked.value ?? 'new',
    )

    function lock() {
        override.value = 'locked'
    }

    /** A vault was created, restored or unlocked. */
    function open() {
        override.value = 'unlocked'
    }

    /** Checks a credential against the vault; the demo accepts one PIN and one password. */
    async function verify(credential: Credential): Promise<boolean> {
        if (credential.method === 'bio') {
            await new Promise((resolve) => setTimeout(resolve, HELLO_DELAY_MS))
            return true
        }
        return credential.method === 'pin'
            ? credential.pin === DEMO_PIN
            : credential.password === DEMO_PASSWORD
    }

    return { state, lock, open, verify }
})
