import {
    computed,
    type MaybeRefOrGetter,
    ref,
    toValue,
    type UnwrapNestedRefs,
} from 'vue'
import { useI18n } from 'vue-i18n'

import { type LinkedService, useVaultServices } from '#features/linked-services'

import {
    type AccountCredentials,
    type CredentialKind,
    SECRET_KINDS,
} from '../../model'

// The account itself, first among its services; never in the registry.
const STEAM: LinkedService = {
    id: 'steam',
    name: 'Steam',
    icon: 'icon-[simple-icons--steam]',
    svg: null,
    builtIn: true,
}

const SECRET_MASK = '••••••••••••'

/** The Credentials card: which service is picked, and which secrets are shown. Both survive a switch between services. */
export function useCredentials(
    credentials: MaybeRefOrGetter<AccountCredentials>,
) {
    const { t } = useI18n()
    const registry = useVaultServices()
    const services = computed(() => {
        const { steam, linked } = toValue(credentials)
        return [
            { key: STEAM.id, service: STEAM, fields: steam },
            ...linked.map(({ service, fields }) => ({
                key: service,
                service: registry.of(service),
                fields,
            })),
        ]
    })

    const labels = computed<Record<CredentialKind, string>>(() => ({
        login: t('Login'),
        email: t('Email'),
        password: t('Password'),
        'secret-word': t('Secret word'),
        phone: t('Phone'),
    }))
    const picked = ref<string | null>(null)
    const revealed = ref(new Set<string>())

    const selected = computed(() => {
        const list = services.value
        return list.find((service) => service.key === picked.value) ?? list[0]
    })
    const isSteam = computed(() => selected.value?.key === STEAM.id)

    return {
        services: computed(() =>
            services.value.map(({ key, service }) => ({
                key,
                service,
                selected: key === selected.value?.key,
            })),
        ),
        count: computed(() => services.value.length),
        select: (key: string) => {
            picked.value = key
        },
        fields: computed(() =>
            (selected.value?.fields ?? []).map(({ kind, value }) => {
                const id = `${selected.value?.key}:${kind}`
                const secret = SECRET_KINDS.includes(kind)
                const shown = !secret || revealed.value.has(id)
                return {
                    id,
                    label: labels.value[kind],
                    value,
                    display: shown ? value : SECRET_MASK,
                    secret,
                    shown,
                }
            }),
        ),
        toggleReveal(id: string) {
            const next = new Set(revealed.value)
            if (!next.delete(id)) next.add(id)
            revealed.value = next
        },
        hint: computed(() =>
            isSteam.value
                ? t('Used to fill Steam login pages')
                : t('Linked service'),
        ),
        removable: computed(() => !isSteam.value),
    }
}
export type CredentialsState = UnwrapNestedRefs<
    ReturnType<typeof useCredentials>
>
