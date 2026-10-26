import {
    computed,
    type MaybeRefOrGetter,
    ref,
    shallowRef,
    toValue,
    type UnwrapNestedRefs,
} from 'vue'
import { useI18n } from 'vue-i18n'

import {
    type LinkedService,
    MAX_ACCOUNT_SERVICES,
    useVaultServices,
} from '#features/linked-services'

import {
    type AccountCredentials,
    CREDENTIAL_LABELS,
    SECRET_KINDS,
} from '../../model'
import { useSecretWrite } from './useSecretWrite'

// The account itself, first among its services; never in the registry.
const STEAM: LinkedService = {
    id: 'steam',
    name: 'Steam',
    icon: 'icon-[simple-icons--steam]',
    svg: null,
    builtIn: true,
}

const SECRET_MASK = '••••••••••••'

/** The Credentials card: which service is picked, which secrets are shown (both survive a switch), and its editors. */
export function useCredentials(
    accountId: () => string,
    credentials: MaybeRefOrGetter<AccountCredentials>,
) {
    const { t } = useI18n()
    const registry = useVaultServices()
    const { write } = useSecretWrite(accountId)
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

    const picked = ref<string | null>(null)
    const revealed = ref(new Set<string>())

    const selected = computed(() => {
        const list = services.value
        return list.find((service) => service.key === picked.value) ?? list[0]
    })
    const isSteam = computed(() => selected.value?.key === STEAM.id)
    const passwordOpen = ref(false)
    const editorOpen = ref(false)
    const editing = shallowRef<string | null>(null)

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
                    label: t(CREDENTIAL_LABELS[kind]),
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
        selectedName: computed(() => selected.value?.service.name ?? ''),
        full: computed(
            () => toValue(credentials).linked.length >= MAX_ACCOUNT_SERVICES,
        ),
        passwordOpen,
        editorOpen,
        editing,
        add() {
            editing.value = null
            editorOpen.value = true
        },
        /** Steam's own entry edits its password; a linked service opens its editor. */
        edit() {
            if (isSteam.value) passwordOpen.value = true
            else {
                editing.value = selected.value?.key ?? null
                editorOpen.value = true
            }
        },
        removeSelected() {
            const key = selected.value?.key
            if (!key || isSteam.value) return
            void write(
                (secret) => ({
                    secret: {
                        ...secret,
                        services: secret.services.filter(
                            (entry) => entry.service !== key,
                        ),
                    },
                }),
                t("Couldn't remove the service"),
            )
        },
    }
}
export type CredentialsState = UnwrapNestedRefs<
    ReturnType<typeof useCredentials>
>
