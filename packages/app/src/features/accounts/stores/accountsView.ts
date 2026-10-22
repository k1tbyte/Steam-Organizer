import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

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

    // Saved by each action: a watcher made in the first caller's setup would keep that page alive.
    const save = () =>
        writeStored(ACCOUNTS_VIEW_STORAGE_KEY, JSON.stringify(state.value))

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
            save()
        },
        setField(field: SearchField) {
            state.value.field = field
            save()
        },
        cycleBan(kind: BanKind) {
            state.value.bans[kind] = nextBanMode(state.value.bans[kind])
            save()
        },
        setSort(sort: SortKey) {
            state.value.sort = sort
            save()
        },
        setDirection(direction: SortDirection) {
            state.value.direction = direction
            save()
        },
        /** Clears the search and every ban filter; the sort stays. */
        resetFilters() {
            state.value.query = ''
            state.value.bans = { ...DEFAULT_VIEW.bans }
            save()
        },
    }
})
