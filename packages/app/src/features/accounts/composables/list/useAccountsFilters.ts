import type { MenuGroup } from '@so/ui'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import {
    BAN_KINDS,
    type BanFilterMode,
    SORT_KEYS,
    type SortKey,
} from '../../model'
import { searchableFields, searchFieldIn } from '../../services/filters'
import { useAccountsViewStore } from '../../stores/accountsView'
import { useFieldPlacement } from '../fields/useFieldPlacement'
import { useBanLabels } from '../useBanLabels'

const MODE_LOOKS = {
    any: {
        icon: 'icon-[lucide--circle-dashed]',
        variant: 'outline',
        color: 'neutral',
    },
    require: { icon: 'icon-[lucide--plus]', variant: 'soft', color: 'accent' },
    exclude: { icon: 'icon-[lucide--minus]', variant: 'soft', color: 'danger' },
} as const satisfies Record<BanFilterMode, object>

const SORT_ICONS: Record<SortKey, string> = {
    vault: 'icon-[lucide--list-ordered]',
    created: 'icon-[lucide--calendar]',
    added: 'icon-[lucide--plus]',
    updated: 'icon-[lucide--clock]',
    level: 'icon-[lucide--trophy]',
}

/** Search, ban chips and sort as the topbar and the filter strip show them. */
export function useAccountsFilters() {
    const { t } = useI18n()
    const store = useAccountsViewStore()
    const banLabels = useBanLabels()
    const { view } = storeToRefs(store)
    const { placement } = useFieldPlacement()
    const field = computed(() =>
        searchFieldIn(view.value.field, placement.value),
    )

    const fieldLabels = computed(() => ({
        nickname: t('Nickname'),
        login: t('Login'),
        note: t('Note'),
        phone: t('Phone'),
        email: t('Email'),
    }))
    const modeLabels = computed<Record<BanFilterMode, string>>(() => ({
        any: t('any'),
        require: t('required'),
        exclude: t('excluded'),
    }))
    const sortLabels = computed(() => ({
        vault: t('Vault order'),
        created: t('Created'),
        added: t('Date added'),
        updated: t('Last update'),
        level: t('Level'),
    }))

    const fieldItems = computed<MenuGroup[]>(() => [
        {
            choice: 'list',
            value: field.value,
            items: searchableFields(placement.value).map((field) => ({
                key: field,
                label: fieldLabels.value[field],
                onSelect: () => store.setField(field),
            })),
        },
    ])

    // The vault's own order has no direction.
    const directed = computed(() => view.value.sort !== 'vault')
    const directionGroup = computed<MenuGroup>(() => {
        const [desc, asc] =
            view.value.sort === 'level'
                ? [t('Highest'), t('Lowest')]
                : [t('Newest'), t('Oldest')]
        return {
            choice: 'segmented',
            value: view.value.direction,
            items: [
                {
                    key: 'desc',
                    label: desc,
                    icon: 'icon-[lucide--arrow-down]',
                    onSelect: () => store.setDirection('desc'),
                },
                {
                    key: 'asc',
                    label: asc,
                    icon: 'icon-[lucide--arrow-up]',
                    onSelect: () => store.setDirection('asc'),
                },
            ],
        }
    })
    const sortItems = computed<MenuGroup[]>(() => [
        {
            choice: 'list',
            value: view.value.sort,
            items: SORT_KEYS.map((key) => ({
                key,
                label: sortLabels.value[key],
                icon: SORT_ICONS[key],
                onSelect: () => store.setSort(key),
            })),
        },
        ...(directed.value ? [directionGroup.value] : []),
    ])

    return {
        query: computed(() => view.value.query),
        setQuery: store.setQuery,
        searchField: computed(() => fieldLabels.value[field.value]),
        fieldItems,
        sortLabel: computed(() => sortLabels.value[view.value.sort]),
        sortItems,
        /** Undefined for the vault's order, which has no direction. */
        descending: computed(() =>
            directed.value ? view.value.direction === 'desc' : undefined,
        ),
        resetFilters: store.resetFilters,
        cycleBan: store.cycleBan,
        chips: computed(() =>
            BAN_KINDS.map((kind) => {
                const mode = view.value.bans[kind]
                return {
                    kind,
                    label: banLabels.value[kind],
                    ...MODE_LOOKS[mode],
                    title: t('{ban}: {mode}, click to change', {
                        ban: banLabels.value[kind],
                        mode: modeLabels.value[mode],
                    }),
                }
            }),
        ),
    }
}
