import { type AsyncStatus, useDesktopLayout } from '@so/ui'
import { storeToRefs } from 'pinia'
import { computed, watch } from 'vue'

import { useMock } from '#core'

import { refreshMock } from '../../mocks'
import {
    filterAccounts,
    searchFieldIn,
    sortAccounts,
    withLiveTags,
} from '../../services/filters'
import { useAccountsViewStore } from '../../stores/accountsView'
import { useEditMode } from '../edit/useEditMode'
import { useFieldPlacement } from '../fields/useFieldPlacement'
import { useVaultTags } from '../tags/useVaultTags'
import { useVaultAccounts } from '../useVaultAccounts'

/** The accounts screen's data: the vault's accounts as the view filters and sorts them, pinned apart from the rest. */
export function useAccountsList() {
    const desktop = useDesktopLayout()
    const store = useAccountsViewStore()
    const { view } = storeToRefs(store)
    const { accounts, presetQuery, togglePin } = useVaultAccounts()
    const { tags } = useVaultTags()
    const { placement } = useFieldPlacement()
    const edit = useEditMode()
    // The bulk refresh in flight has no source yet.
    const refresh = useMock(() => undefined, refreshMock)
    // Edit mode moves accounts in the vault order: the search and filters apply, the sort waits.
    const visible = computed(() => {
        const shown = filterAccounts(accounts.value, {
            ...withLiveTags(view.value, tags.value),
            field: searchFieldIn(view.value.field, placement.value),
        })
        if (edit.open.value) return shown
        const { sort, direction } = view.value
        return sortAccounts(shown, sort, direction)
    })

    watch(
        presetQuery,
        (query) => {
            if (query !== undefined) store.setQuery(query)
        },
        { immediate: true },
    )

    const vaultEmpty = computed(() => accounts.value.length === 0)

    return {
        vaultEmpty,
        refresh,
        pinned: computed(() => visible.value.filter((a) => a.pinned)),
        rest: computed(() => visible.value.filter((a) => !a.pinned)),
        // Phones show what is left; desktop also shows what the vault holds.
        count: computed(() => {
            const shown = visible.value.length
            return desktop.value && !vaultEmpty.value
                ? `${shown}/${accounts.value.length}`
                : String(shown)
        }),
        status: computed<AsyncStatus>(() =>
            visible.value.length === 0 ? 'empty' : 'ready',
        ),
        togglePin,
        editing: computed(() => edit.open.value),
    }
}
