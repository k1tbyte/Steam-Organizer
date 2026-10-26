import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { ACCOUNTS_VIEW_STORAGE_KEY, readStored, writeStored } from '#core'

import type {
    AccountsView,
    BanKind,
    SearchField,
    SortDirection,
    SortKey,
    TagMatch,
} from '../model'
import { nextBanMode } from '../services/filters'
import { DEFAULT_VIEW, parseView } from '../services/storedState'

/** The list's search, ban and tag filters and sort (shared by the topbar search and the filter strip, remembered across reloads) and the pin and order changes not yet in the vault. */
export const useAccountsViewStore = defineStore('accounts-view', () => {
    const state = ref<AccountsView>(
        parseView(readStored(ACCOUNTS_VIEW_STORAGE_KEY)),
    )

    // Saved by each action: a watcher made in the first caller's setup would keep that page alive.
    const save = () =>
        writeStored(ACCOUNTS_VIEW_STORAGE_KEY, JSON.stringify(state.value))

    // Shown until the vault has them, so a moved card never snaps back while it saves; a sample keeps them for the session.
    const pins = ref<Record<string, boolean>>({})
    const order = ref<string[] | null>(null)
    let writes = 0

    return {
        view: computed(() => state.value),
        pins: computed(() => pins.value),
        order: computed(() => order.value),
        setPinned(id: string, pinned: boolean) {
            pins.value[id] = pinned
        },
        /** The vault order as account ids. */
        setOrder(ids: string[]) {
            order.value = ids
        },
        /** Drops the pins and order once `write` and every other one running settle. */
        async settle(write: Promise<unknown>) {
            writes += 1
            try {
                await write
            } finally {
                writes -= 1
                if (writes === 0) {
                    pins.value = {}
                    order.value = null
                }
            }
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
        toggleTag(id: string) {
            const { tags } = state.value
            state.value.tags = tags.includes(id)
                ? tags.filter((tag) => tag !== id)
                : [...tags, id]
            save()
        },
        setTagMatch(match: TagMatch) {
            state.value.tagMatch = match
            save()
        },
        clearTags() {
            state.value.tags = []
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
        /** Clears the search and every filter; the sort stays. */
        resetFilters() {
            state.value.query = ''
            state.value.bans = { ...DEFAULT_VIEW.bans }
            state.value.tags = []
            save()
        },
    }
})
