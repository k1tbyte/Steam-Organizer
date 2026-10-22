import { storeToRefs } from 'pinia'
import { computed } from 'vue'

import { useMock } from '#core'

import { accountsMock } from '../mocks'
import { applyOrder, withGroupOrder } from '../services/reorder'
import { useAccountsViewStore } from '../stores/accountsView'

/** The vault's accounts with this session's pins and order: the one source the list, the profile and the popup read. */
export function useVaultAccounts() {
    const store = useAccountsViewStore()
    const { pins, order } = storeToRefs(store)
    // The vault has no source yet.
    const sample = useMock(() => undefined, accountsMock)

    const accounts = computed(() => {
        const withPins = (sample.value?.accounts ?? []).map((account) => {
            const pinned = pins.value[account.id]
            return pinned === undefined ? account : { ...account, pinned }
        })
        return order.value ? applyOrder(withPins, order.value) : withPins
    })

    return {
        accounts,
        /** A sample may open the list on a search, so "no results" can be reviewed without typing. */
        presetQuery: computed(() => sample.value?.query),
        togglePin(id: string) {
            const current = accounts.value.find((a) => a.id === id)?.pinned
            store.setPinned(id, !current)
        },
        /** One group (the pinned or the rest) in this order, in the places it holds in the vault. */
        reorderGroup(ids: string[]) {
            store.setOrder(
                withGroupOrder(
                    accounts.value.map((a) => a.id),
                    ids,
                ),
            )
        },
    }
}
