import { computed } from 'vue'

import { useAccountSecret } from '#features/accounts'

import type { AccountCredentials } from '../../model'

const STEAM_FIELDS = ['login', 'password', 'email', 'phone'] as const

/** What the vault keeps for the account: its credentials, the revocation code and the movable fields it keeps secret.
 *  Empty while the secret opens; `held` is false for a sample. */
export function useVaultCredentials(id: string) {
    const { held, secret } = useAccountSecret(id)
    return {
        held,
        credentials: computed<AccountCredentials>(() => {
            const opened = secret.value
            const steam = STEAM_FIELDS.flatMap((kind) => {
                const value = opened?.[kind]
                return value ? [{ kind, value }] : []
            })
            return { steam, linked: opened?.services ?? [] }
        }),
        revocationCode: computed(
            () => secret.value?.authenticator?.revocationCode ?? null,
        ),
        login: computed(() => secret.value?.login ?? ''),
        note: computed(() => secret.value?.note ?? ''),
    }
}
