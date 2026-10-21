import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

import { ACCOUNTS_VIEW_STORAGE_KEY, readStored, writeStored } from '#core'

import type {
    AccountsView,
    BanKind,
    SearchField,
    SortDirection,
    SortKey,
} from '../model'
import { nextBanMode } from '../services/filters'
import { DEFAULT_VIEW, parseView } from '../services/storedState'

/** The list's search, ban filters and sort (shared by the topbar search and the filter strip, remembered across reloads) and the session's pin changes. */
export const useAccountsViewStore = defineStore('accounts-view', () => {
    const state = ref<AccountsView>(
        parseView(readStored(ACCOUNTS_VIEW_STORAGE_KEY)),
    )

    watch(
        state,
        (view) => writeStored(ACCOUNTS_VIEW_STORAGE_KEY, JSON.stringify(view)),
        { deep: true },
    )

    // Not persisted: pin changes last the session until the vault stores them.
    const pins = ref<Record<string, boolean>>({})

    return {
        view: computed(() => state.value),
        pins: computed(() => pins.value),
        setPinned(id: string, pinned: boolean) {
            pins.value[id] = pinned
        },
        setQuery(query: string) {
            state.value.query = query
        },
        setField(field: SearchField) {
            state.value.field = field
        },
        cycleBan(kind: BanKind) {
            state.value.bans[kind] = nextBanMode(state.value.bans[kind])
        },
        setSort(sort: SortKey) {
            state.value.sort = sort
        },
        setDirection(direction: SortDirection) {
            state.value.direction = direction
        },
        /** Clears the search and every ban filter; the sort stays. */
        resetFilters() {
            state.value.query = ''
            state.value.bans = { ...DEFAULT_VIEW.bans }
        },
    }
})
