import type { FieldDefaults, FieldPlacement, MovableField } from '@so/core'
import { useToast } from '@so/ui'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { reportError } from '#core'
import { useFieldPlacement } from '#features/accounts'

import type { FieldKey } from '../../model'
import {
    FIELD_KEYS,
    isFixed,
    placementMoves,
    placementOf,
    secretCount,
} from '../../services/fieldSecrecy'

const ICONS: Record<FieldKey, string> = {
    nickname: 'icon-[lucide--user-round]',
    login: 'icon-[lucide--at-sign]',
    note: 'icon-[lucide--sticky-note]',
    phone: 'icon-[lucide--phone]',
    email: 'icon-[lucide--mail]',
    password: 'icon-[lucide--key-round]',
    linked: 'icon-[lucide--link]',
    auth: 'icon-[lucide--shield-check]',
}

/** Settings → Fields: a placement drafted here moves the fields of every account only on Apply. */
export function useFieldsSection() {
    const { t, locale } = useI18n()
    const toast = useToast()
    const fields = useFieldPlacement()
    const draft = ref<FieldDefaults>({ ...fields.placement.value })
    const moves = computed(() =>
        placementMoves(fields.placement.value, draft.value),
    )
    // A placement saved meanwhile (a finished move, another device) shows unless the user has drafted one.
    watch(fields.placement, (applied, before) => {
        if (placementMoves(before, draft.value).moved.length === 0)
            draft.value = { ...applied }
    })

    const labels = computed<Record<FieldKey, string>>(() => ({
        nickname: t('Nickname'),
        login: t('Login'),
        note: t('Note'),
        phone: t('Phone'),
        email: t('Email'),
        password: t('Password'),
        linked: t('Linked services'),
        auth: t('Steam Guard'),
    }))
    const list = (keys: MovableField[]) =>
        new Intl.ListFormat(locale.value, { type: 'conjunction' }).format(
            keys.map((key) => labels.value[key]),
        )
    const count = computed(() => fields.accountCount.value)

    async function apply(target: FieldDefaults) {
        try {
            await fields.apply(target)
        } catch (error) {
            reportError(error, 'field-placement')
            toast.add({
                color: 'danger',
                title: t("Couldn't move the fields"),
                description: t('Apply again to finish.'),
            })
        }
    }

    return {
        modeItems: computed(() => [
            {
                value: 'searchable' as const,
                label: t('Searchable'),
                icon: 'icon-[lucide--search]',
            },
            {
                value: 'secret' as const,
                label: t('Secret'),
                icon: 'icon-[lucide--lock-keyhole]',
            },
        ]),
        rows: computed(() =>
            FIELD_KEYS.map((key) => {
                const changed = moves.value.moved.includes(key as MovableField)
                const was = placementOf(key, fields.placement.value)
                return {
                    key,
                    label: labels.value[key],
                    icon: ICONS[key],
                    fixed: isFixed(key) ? placementOf(key, draft.value) : null,
                    mode: placementOf(key, draft.value),
                    changeNote: changed
                        ? was === 'secret'
                            ? t('Was secret')
                            : t('Was searchable')
                        : null,
                }
            }),
        ),
        summary: computed(() => {
            const secret = secretCount(FIELD_KEYS, draft.value)
            return t('{searchable} searchable · {secret} secret', {
                searchable: FIELD_KEYS.length - secret,
                secret,
            })
        }),
        locked: computed(() => fields.run.value !== null),
        pending: computed(
            () => moves.value.moved.length > 0 && fields.run.value === null,
        ),
        warning: computed(() => {
            const { toSecret, toSearchable } = moves.value
            return [
                toSecret.length > 0 &&
                    t(
                        '{fields} will become secret in all {count} accounts. Search and filters stop seeing them.',
                        {
                            fields: list(toSecret),
                            count: count.value,
                        },
                    ),
                toSearchable.length > 0 &&
                    t(
                        '{fields} will become searchable in all {count} accounts.',
                        {
                            fields: list(toSearchable),
                            count: count.value,
                        },
                    ),
            ]
                .filter(Boolean)
                .join(' ')
        }),
        applyLabel: computed(() =>
            t('Apply to {count} accounts', { count: count.value }),
        ),
        progress: computed(() => {
            const run = fields.run.value
            if (!run) return null
            return {
                label: t('Moving {fields}', { fields: list(run.fields) }),
                count: t('{done} of {total}', {
                    done: run.done,
                    total: run.total,
                }),
                value: run.total === 0 ? 100 : (run.done / run.total) * 100,
            }
        }),
        done: computed(() => {
            const finished = fields.finished.value
            if (finished === null || moves.value.moved.length > 0) return null
            return t('Done. {count} accounts updated.', { count: finished })
        }),
        interrupted: fields.interrupted,
        setMode(key: FieldKey, mode: FieldPlacement) {
            if (isFixed(key)) return
            draft.value = { ...draft.value, [key]: mode }
            fields.dismiss()
        },
        cancel() {
            draft.value = { ...fields.placement.value }
        },
        apply: () => apply(draft.value),
        /** Moves what an interrupted move left, to the placement already saved. */
        finish: () => apply(fields.placement.value),
    }
}
