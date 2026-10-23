import { computed, shallowRef } from 'vue'

import type { Account } from '../../model'
import type { Group } from '../../services/reorder'

// Module state: the bar (the route's header view) and the grid (its page) share it.
const picked = shallowRef<{ group: Group; ids: ReadonlySet<string> }>({
    group: 'all',
    ids: new Set(),
})
let anchor: string | null = null

/** The cards picked to move together, all from one group: a click toggles one, Shift+click picks the range from the last one clicked. */
export function useReorderSelection() {
    return {
        group: computed(() => picked.value.group),
        ids: computed(() => picked.value.ids),
        count: computed(() => picked.value.ids.size),
        /** Drops picks that left the group (a sync, a mock switch); `order` is the group now. */
        retain(order: readonly Account[]) {
            const present = new Set(order.map((a) => a.id))
            const kept = [...picked.value.ids].filter((id) => present.has(id))
            if (anchor && !present.has(anchor)) anchor = null
            if (kept.length < picked.value.ids.size)
                picked.value = { group: picked.value.group, ids: new Set(kept) }
        },
        /** `order` is `group`, the one `id` is in; a pick in another group starts over. */
        toggle(
            id: string,
            group: Group,
            order: readonly Account[],
            range: boolean,
        ) {
            const next = new Set(
                picked.value.group === group ? picked.value.ids : [],
            )
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
            picked.value = { group, ids: next }
        },
        clear() {
            anchor = null
            picked.value = { group: picked.value.group, ids: new Set() }
        },
    }
}
