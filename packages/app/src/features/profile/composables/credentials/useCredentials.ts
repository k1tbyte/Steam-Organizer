import {
    computed,
    type MaybeRefOrGetter,
    ref,
    toValue,
    type UnwrapNestedRefs,
} from 'vue'
import { useI18n } from 'vue-i18n'

import {
    type CredentialKind,
    type CredentialService,
    SECRET_KINDS,
} from '../../model'

const SECRET_MASK = '••••••••••••'

/** The Credentials card: which service is picked, and which secrets are shown. Both survive a switch between services. */
export function useCredentials(
    services: MaybeRefOrGetter<CredentialService[]>,
) {
    const { t } = useI18n()

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
        const list = toValue(services)
        return list.find((service) => service.key === picked.value) ?? list[0]
    })
    const isSteam = computed(() => selected.value?.key === 'steam')

    return {
        services: computed(() =>
            toValue(services).map((service) => ({
                key: service.key,
                label: service.label,
                icon: service.icon,
                selected: service.key === selected.value?.key,
            })),
        ),
        count: computed(() => toValue(services).length),
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
        hint: computed(() => {
            if (isSteam.value) return t('Used to fill Steam login pages')
            const type = selected.value?.type
            return type
                ? t('Linked service · {type}', { type })
                : t('Linked service')
        }),
        removable: computed(() => !isSteam.value),
    }
}
export type CredentialsState = UnwrapNestedRefs<
    ReturnType<typeof useCredentials>
>
