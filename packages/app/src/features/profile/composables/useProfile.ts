import type { AsyncStatus } from '@so/ui'
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useMock } from '#core'
import { useVaultAccounts } from '#features/accounts'

import { profileMock, profileOf } from '../mocks'
import { useVaultCredentials } from './credentials/useVaultCredentials'

/** The open profile's account and its Steam-side data; an id the vault does not hold goes back to the list. */
export function useProfile() {
    const router = useRouter()
    // The page is keyed by its path, so the id never changes under it; a leaving page keeps its own.
    const id = String(useRoute().params.id)
    const { accounts, togglePin } = useVaultAccounts()
    // Steam data and the account's lock have no source yet.
    const sample = useMock(() => undefined, profileMock)
    const vault = useVaultCredentials(id)

    const account = computed(() => {
        const found = accounts.value.find((a) => a.id === id)
        return found && { ...found, ...sample.value?.account }
    })
    const details = computed(() => {
        const sampled = sample.value
        if (!account.value || !sampled) return undefined
        const base = profileOf(account.value)
        const shown = sampled.details?.(base) ?? base
        if (!vault.held.value) return shown
        return {
            ...shown,
            credentials: vault.credentials.value,
            revocationCode: vault.revocationCode.value,
        }
    })

    watch(
        account,
        (found) => {
            if (!found) void router.replace('/')
        },
        { immediate: true },
    )

    return {
        account,
        details,
        status: computed<AsyncStatus>(() =>
            account.value && details.value ? 'ready' : 'empty',
        ),
        togglePin: () => togglePin(id),
    }
}
