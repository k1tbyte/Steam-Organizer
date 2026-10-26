import { computed } from 'vue'

import { useAccountSecret } from '#features/accounts'

import { type CredentialService, STEAM_SERVICE } from '../../model'
import { useServiceTypes } from './useServiceTypes'

const STEAM_FIELDS = ['login', 'password', 'email', 'phone'] as const

/** What the vault keeps for the account: Steam's fields and the linked services for the Credentials card, the revocation code.
 *  Empty while the secret opens; `held` is false for a sample. */
export function useVaultCredentials(id: string) {
    const { held, secret } = useAccountSecret(id)
    const serviceTypes = useServiceTypes()

    const services = computed<CredentialService[]>(() => {
        const opened = secret.value
        if (!opened) return []
        const steam = STEAM_FIELDS.flatMap((kind) => {
            const value = opened[kind]
            return value ? [{ kind, value }] : []
        })
        const linked = opened.services.map((service, index) => {
            const type = serviceTypes.of(service.kind)
            return {
                key: `service-${index}`,
                label: service.name || type.label,
                icon: type.icon,
                type:
                    service.name && type.kind !== 'other'
                        ? type.label
                        : undefined,
                fields: service.fields,
            }
        })
        return [{ ...STEAM_SERVICE, fields: steam }, ...linked]
    })

    return {
        held,
        services,
        revocationCode: computed(
            () => secret.value?.authenticator?.revocationCode ?? null,
        ),
    }
}
