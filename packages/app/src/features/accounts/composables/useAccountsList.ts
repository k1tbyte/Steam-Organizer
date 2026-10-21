import { type AsyncStatus, useDesktopLayout } from '@so/ui'
import { storeToRefs } from 'pinia'
import { computed, watch } from 'vue'

import { useMock } from '#core'

import { accountsMock, refreshMock } from '../mocks'
import { filterAccounts, sortAccounts } from '../services/filters'
import { useAccountsViewStore } from '../stores/accountsView'

/** The accounts screen's data: the vault's accounts as the view filters and sorts them, pinned apart from the rest. */
export function useAccountsList() {
    const desktop = useDesktopLayout()
    const store = useAccountsViewStore()
    const { view, pins } = storeToRefs(store)
    // The vault's accounts and the bulk refresh in flight have no source yet.
    const sample = useMock(() => undefined, accountsMock)
    const refresh = useMock(() => undefined, refreshMock)

    const accounts = computed(() =>
        (sample.value?.accounts ?? []).map((account) => {
            const pinned = pins.value[account.id]
            return pinned === undefined ? account : { ...account, pinned }
        }),
    )
    const visible = computed(() => {
        const { sort, direction } = view.value
        return sortAccounts(
            filterAccounts(accounts.value, view.value),
            sort,
            direction,
        )
    })

    // A sample may open on a search, so "no results" can be reviewed without typing.
    watch(
        sample,
        (value) => {
            if (value?.query !== undefined) store.setQuery(value.query)
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
        togglePin(id: string) {
            const current = accounts.value.find((a) => a.id === id)?.pinned
            store.setPinned(id, !current)
        },
    }
}
