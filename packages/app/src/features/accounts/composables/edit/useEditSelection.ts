import { computed, shallowRef } from 'vue'

import type { Account } from '../../model'

// Module state: the bar (the route's header view) and the grid (its page) share it.
const picked = shallowRef<ReadonlySet<string>>(new Set())
const shown = shallowRef<readonly string[]>([])
let anchor: string | null = null

/** The picked cards, from both groups: a click toggles one, Shift+click picks the range from the last one clicked, Select all every shown one. */
export function useEditSelection() {
    return {
        ids: computed(() => picked.value),
        count: computed(() => picked.value.size),
        /** `order` is the cards as the screen shows them. */
        toggle(id: string, order: readonly Account[], range: boolean) {
            const next = new Set(picked.value)
            const ids = order.map((a) => a.id)
            const from = range && anchor ? ids.indexOf(anchor) : -1
            const to = ids.indexOf(id)
            if (from >= 0)
                for (const pick of ids.slice(
                    Math.min(from, to),
                    Math.max(from, to) + 1,
                ))
                    next.add(pick)
            else if (!next.delete(id)) next.add(id)
            anchor = id
            picked.value = next
        },
        selectAll() {
            picked.value = new Set(shown.value)
        },
        clear() {
            anchor = null
            picked.value = new Set()
        },
        /** The cards the grid shows (a filter, a sync, a mock switch change them): picks they lost drop. */
        show(accounts: readonly Account[]) {
            shown.value = accounts.map((a) => a.id)
            const present = new Set(shown.value)
            if (anchor && !present.has(anchor)) anchor = null
            const kept = [...picked.value].filter((id) => present.has(id))
            if (kept.length < picked.value.size) picked.value = new Set(kept)
        },
    }
}
