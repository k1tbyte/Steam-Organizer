import type { AsyncStatus } from '@so/ui'
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useMock } from '#core'
import { useVaultAccounts } from '#features/accounts'

import { type ProfileSample, profileMock, profileOf } from '../mocks'
import { vaultProfile } from '../services/vaultProfile'
import { useVaultCredentials } from './credentials/useVaultCredentials'

/** The open profile's account and its Steam-side data; an id the vault does not hold goes back to the list. */
export function useProfile() {
    const router = useRouter()
    // The page is keyed by its path, so the id never changes under it; a leaving page keeps its own.
    const id = String(useRoute().params.id)
    const { accounts, togglePin } = useVaultAccounts()
    const vault = useVaultCredentials(id)
    // A vault account reads its own profile; a sample stands in for the rest.
    const sample = useMock(
        (): ProfileSample | undefined => (vault.held.value ? {} : undefined),
        profileMock,
    )

    // A login or note the vault keeps secret, or all an open `everything` lock hid, shows here once its secret opens.
    const account = computed(() => {
        const listed = accounts.value.find((a) => a.id === id)
        const found = listed && (vault.whole.value ?? listed)
        return (
            found && {
                ...found,
                login: found.login || vault.login.value,
                note: found.note || vault.note.value,
                ...sample.value?.account,
            }
        )
    })
    const details = computed(() => {
        const sampled = sample.value
        if (!account.value || !sampled) return undefined
        const base = vault.held.value
            ? vaultProfile(account.value)
            : profileOf(account.value)
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
