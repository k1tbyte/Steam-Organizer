import { MIN_PASSWORD_LENGTH, type ServiceCredentials } from '@so/core'
import { computed, type Ref, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { useCloseOnSuccess } from '#core'
import { MAX_ACCOUNT_SERVICES } from '#features/linked-services'

import {
    CREDENTIAL_KINDS,
    CREDENTIAL_LABELS,
    type CredentialKind,
    SECRET_KINDS,
} from '../../model'
import {
    type CredentialProblem,
    credentialProblem,
} from '../../services/credentialRules'
import { useSecretWrite } from './useSecretWrite'

const INPUTS: Record<
    CredentialKind,
    { icon: string; type: string; placeholder: string }
> = {
    login: {
        icon: 'icon-[lucide--at-sign]',
        type: 'text',
        placeholder: 'Login',
    },
    email: {
        icon: 'icon-[lucide--mail]',
        type: 'email',
        placeholder: 'name@example.com',
    },
    password: {
        icon: 'icon-[lucide--key-round]',
        type: 'password',
        placeholder: '••••••••',
    },
    'secret-word': {
        icon: 'icon-[lucide--message-square-lock]',
        type: 'text',
        placeholder: 'Answer or code word',
    },
    phone: {
        icon: 'icon-[lucide--phone]',
        type: 'tel',
        placeholder: '+1 555 010 2233',
    },
}
const STARTER: CredentialKind[] = ['login', 'password']

interface ServiceEditorProps {
    accountId: string
    linked: readonly ServiceCredentials[]
    /** The service being edited; null adds one. */
    editing: string | null
}

/** Add or edit one linked service: which service, which fields it keeps, their values. */
export function useServiceEditor(
    props: ServiceEditorProps,
    open: Ref<boolean>,
) {
    const { t } = useI18n()
    const { saving, write } = useSecretWrite(() => props.accountId)
    const closeOnSuccess = useCloseOnSuccess(open)
    const service = shallowRef<string | null>(null)
    const kinds = ref(new Set<CredentialKind>())
    const values = ref<Partial<Record<CredentialKind, string>>>({})

    watch(open, (isOpen) => {
        if (!isOpen) return
        const entry = props.linked.find(
            (found) => found.service === props.editing,
        )
        service.value = entry?.service ?? null
        kinds.value = new Set(
            entry?.fields.map((field) => field.kind) ?? STARTER,
        )
        values.value = Object.fromEntries(
            entry?.fields.map((field) => [field.kind, field.value]) ?? [],
        )
    })
    const shown = computed(() =>
        CREDENTIAL_KINDS.filter((kind) => kinds.value.has(kind)),
    )
    // Secrets keep their spaces: a password may start or end with one.
    const fields = computed(() =>
        shown.value.flatMap((kind) => {
            const raw = values.value[kind] ?? ''
            const value = SECRET_KINDS.includes(kind) ? raw : raw.trim()
            return raw.trim() ? [{ kind, value }] : []
        }),
    )
    const problems = computed(
        () =>
            new Map(
                shown.value.flatMap((kind) => {
                    const problem = credentialProblem(
                        kind,
                        values.value[kind] ?? '',
                    )
                    return problem ? [[kind, problem] as const] : []
                }),
            ),
    )
    const messages = computed<Record<CredentialProblem, string>>(() => ({
        short: t('At least {count} characters', { count: MIN_PASSWORD_LENGTH }),
        phone: t('At least 8 digits'),
        email: t('Not an email address'),
    }))
    const canSave = computed(
        () =>
            service.value !== null &&
            fields.value.length > 0 &&
            problems.value.size === 0 &&
            !saving.value,
    )

    /** Checked again on the latest record: an earlier write may have moved the services on meanwhile. */
    function save() {
        const id = service.value
        if (!id || !canSave.value) return
        const entry = { service: id, fields: fields.value }
        const editing = props.editing
        return closeOnSuccess(() =>
            write((secret) => {
                const others = secret.services.filter(
                    (found) => found.service !== editing,
                )
                const gone =
                    editing !== null && others.length === secret.services.length
                const full =
                    editing === null && others.length >= MAX_ACCOUNT_SERVICES
                if (
                    gone ||
                    full ||
                    others.some((found) => found.service === id)
                )
                    return null
                const services = editing
                    ? secret.services.map((found) =>
                          found.service === editing ? entry : found,
                      )
                    : [...secret.services, entry]
                return { secret: { ...secret, services } }
            }, t("Couldn't save the service")),
        )
    }

    return {
        service,
        values,
        adding: computed(() => props.editing === null),
        count: computed(() =>
            t('{count} of {max}', {
                count: props.linked.length + 1,
                max: MAX_ACCOUNT_SERVICES,
            }),
        ),
        taken: computed(() =>
            props.linked
                .map((entry) => entry.service)
                .filter((id) => id !== props.editing),
        ),
        chips: computed(() =>
            CREDENTIAL_KINDS.map((kind) => ({
                kind,
                label: t(CREDENTIAL_LABELS[kind]),
                icon: INPUTS[kind].icon,
                on: kinds.value.has(kind),
            })),
        ),
        inputs: computed(() =>
            shown.value.map((kind) => {
                const problem = problems.value.get(kind)
                return {
                    kind,
                    label: t(CREDENTIAL_LABELS[kind]),
                    ...INPUTS[kind],
                    error: problem && messages.value[problem],
                }
            }),
        ),
        toggle(kind: CredentialKind) {
            const next = new Set(kinds.value)
            if (!next.delete(kind)) next.add(kind)
            kinds.value = next
        },
        saving,
        canSave,
        save,
    }
}
