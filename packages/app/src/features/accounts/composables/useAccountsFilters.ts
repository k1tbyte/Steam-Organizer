import type { DropdownGroup, DropdownItem } from '@so/ui'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import {
    BAN_KINDS,
    type BanFilterMode,
    SEARCH_FIELDS,
    SORT_KEYS,
} from '../model'
import { useAccountsViewStore } from '../stores/accountsView'
import { useBanLabels } from './useBanLabels'

const MODE_LOOKS = {
    any: {
        icon: 'icon-[lucide--circle-dashed]',
        variant: 'outline',
        color: 'neutral',
    },
    require: { icon: 'icon-[lucide--plus]', variant: 'soft', color: 'accent' },
    exclude: { icon: 'icon-[lucide--minus]', variant: 'soft', color: 'danger' },
} as const satisfies Record<BanFilterMode, object>

/** Search, ban chips and sort as the topbar and the filter strip show them. */
export function useAccountsFilters() {
    const { t } = useI18n()
    const store = useAccountsViewStore()
    const banLabels = useBanLabels()
    const { view } = storeToRefs(store)

    const fieldLabels = computed(() => ({
        nickname: t('Nickname'),
        login: t('Login'),
        note: t('Note'),
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

    const fieldItems = computed<DropdownItem[]>(() =>
        SEARCH_FIELDS.map((field) => ({
            label: fieldLabels.value[field],
            checked: view.value.field === field,
            onSelect: () => store.setField(field),
        })),
    )

    const sortItems = computed<DropdownGroup[]>(() => [
        {
            label: t('Sort by'),
            items: SORT_KEYS.map((key) => ({
                label: sortLabels.value[key],
                checked: view.value.sort === key,
                onSelect: () => store.setSort(key),
            })),
        },
        {
            label: t('Order'),
            items: [
                {
                    label: t('Descending'),
                    checked: view.value.direction === 'desc',
                    onSelect: () => store.setDirection('desc'),
                },
                {
                    label: t('Ascending'),
                    checked: view.value.direction === 'asc',
                    onSelect: () => store.setDirection('asc'),
                },
            ],
        },
    ])

    return {
        query: computed(() => view.value.query),
        setQuery: store.setQuery,
        searchField: computed(() => fieldLabels.value[view.value.field]),
        fieldItems,
        sortLabel: computed(() => sortLabels.value[view.value.sort]),
        sortItems,
        descending: computed(() => view.value.direction === 'desc'),
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
