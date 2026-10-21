import { computed, ref, shallowRef, watch } from 'vue'

import { useVaultAccounts } from '#features/accounts'

import { optionId } from '../model'
import { clampSelection, rankAccounts, stepSelection } from '../services/picker'

/** Search and selection over the vault's accounts: the popup and the injected picker both drive it. */
export function useAccountPicker() {
    const { accounts } = useVaultAccounts()
    const query = ref('')
    const rows = computed(() => rankAccounts(accounts.value, query.value))

    const picked = ref(0)
    const index = computed(() =>
        clampSelection(picked.value, rows.value.length),
    )
    const selected = computed(() => rows.value[index.value])
    // Set by the keyboard and a new search: a hover selection must not scroll the list under the pointer.
    const revealed = shallowRef({ index: 0 })
    watch(query, () => {
        picked.value = 0
        revealed.value = { index: 0 }
    })

    return {
        query,
        rows,
        index,
        selected,
        activeId: computed(() => selected.value && optionId(selected.value.id)),
        revealed,
        hasAccounts: computed(() => accounts.value.length > 0),
        select(next: number) {
            picked.value = next
        },
        move(step: number) {
            const next = stepSelection(index.value, step, rows.value.length)
            picked.value = next
            revealed.value = { index: next }
        },
    }
}
