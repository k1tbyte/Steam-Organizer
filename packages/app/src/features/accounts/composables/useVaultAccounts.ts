import { storeToRefs } from 'pinia'
import { computed } from 'vue'

import { useMock } from '#core'

import { accountsMock } from '../mocks'
import { useAccountsViewStore } from '../stores/accountsView'

/** The vault's accounts with this session's pins: the one source the list, the profile and the popup read. */
export function useVaultAccounts() {
    const store = useAccountsViewStore()
    const { pins } = storeToRefs(store)
    // The vault has no source yet.
    const sample = useMock(() => undefined, accountsMock)

    const accounts = computed(() =>
        (sample.value?.accounts ?? []).map((account) => {
            const pinned = pins.value[account.id]
            return pinned === undefined ? account : { ...account, pinned }
        }),
    )

    return {
        accounts,
        /** A sample may open the list on a search, so "no results" can be reviewed without typing. */
        presetQuery: computed(() => sample.value?.query),
        togglePin(id: string) {
            const current = accounts.value.find((a) => a.id === id)?.pinned
            store.setPinned(id, !current)
        },
    }
}
