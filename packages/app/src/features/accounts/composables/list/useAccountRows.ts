import { useVirtualizer } from '@tanstack/vue-virtual'
import { useResizeObserver } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, type Ref, ref, watch } from 'vue'

import { useScrollRoot } from '#core'

import type { Account } from '../../model'
import { buildRows, columnsFor, rowHeight } from '../../services/listRows'
import { assignSlots } from '../../services/listSlots'
import { useCardFieldsStore } from '../../stores/cardFields'
import { useCardMetrics } from '../useCardMetrics'

const OVERSCAN_ROWS = 3

// Layout offsets ignore transforms: the list may mount inside a page that is still sliding in.
function offsetWithin(el: HTMLElement, scroller: HTMLElement): number {
    let top = 0
    let node: HTMLElement | null = el
    while (node && node !== scroller) {
        top += node.offsetTop
        node = node.offsetParent as HTMLElement | null
    }
    return top
}

/** The list as virtual rows of cards against the shell's scroll container. The column count follows the list's width and row heights come from the card layout, so no row is ever measured. */
export function useAccountRows(
    source: { pinned: Ref<Account[]>; rest: Ref<Account[]> },
    list: Ref<HTMLElement | null>,
) {
    const { flags } = storeToRefs(useCardFieldsStore())
    const metrics = useCardMetrics(flags)
    const root = useScrollRoot()
    const width = ref(0)
    useResizeObserver(list, ([entry]) => {
        if (entry) width.value = entry.contentRect.width
    })
    // The observer waits a frame, which a View Transition holds, so Back would capture one column
    // (`useElementSize` resets its mount read to 0). Read at once, fractional like the observer.
    watch(
        list,
        (el) => {
            width.value = el ? Number.parseFloat(getComputedStyle(el).width) : 0
        },
        { flush: 'post' },
    )

    const gap = computed(() => metrics.gapUnits.value * metrics.unit.value)
    const columns = computed(() => columnsFor(width.value, gap.value))
    // No rows before the width is known: a one-column first pass would mount cards only to drop them.
    const rows = computed(() =>
        width.value > 0
            ? buildRows(source.pinned.value, source.rest.value, columns.value)
            : [],
    )
    const sizes = computed(() => ({
        unit: metrics.unit.value,
        gapUnits: metrics.gapUnits.value,
        cardPx: metrics.cardPx.value,
    }))

    // Where the list starts inside the scroller.
    const margin = ref(0)
    watch(
        [list, root, width],
        () => {
            const el = list.value
            const scroller = root.value
            if (!el || !scroller) return
            margin.value = offsetWithin(el, scroller)
        },
        { flush: 'post' },
    )

    const virtualizer = useVirtualizer(
        computed(() => ({
            count: rows.value.length,
            getScrollElement: () => root.value,
            estimateSize: (index: number) => {
                const row = rows.value[index]
                return row ? rowHeight(row, sizes.value) : 0
            },
            getItemKey: (index: number) => {
                const row = rows.value[index]
                return row ? `${row.kind}:${row.key}` : index
            },
            scrollMargin: margin.value,
            overscan: OVERSCAN_ROWS,
        })),
    )

    // Sizes are estimates the virtualizer caches: a new card height must drop them.
    watch([rows, sizes], () => virtualizer.value.measure())

    // Each render carries the last assignment forward; only the keys depend on it.
    let slots = new Map<string, number>()
    const items = computed(() => {
        const visible = virtualizer.value.getVirtualItems()
        slots = assignSlots(
            slots,
            visible.map((item) => String(item.key)),
        )
        return visible.flatMap((item) => {
            const row = rows.value[item.index]
            return row
                ? [
                      {
                          slot: slots.get(String(item.key)) ?? 0,
                          start: item.start,
                          size: item.size,
                          row,
                      },
                  ]
                : []
        })
    })

    return {
        flags,
        touch: metrics.touch,
        rows,
        sizes,
        /** The CSS grid's tracks: `columns` cells of `cellWidth` with `gap` between. */
        cell: computed(() => ({
            columns: columns.value,
            gap: gap.value,
            cellWidth:
                (width.value - gap.value * (columns.value - 1)) / columns.value,
        })),
        rowStyle: computed(() => ({
            gridTemplateColumns: `repeat(${columns.value}, minmax(0, 1fr))`,
            columnGap: `calc(var(--density-unit) * ${metrics.gapUnits.value})`,
        })),
        margin,
        totalSize: computed(() => virtualizer.value.getTotalSize()),
        items,
    }
}
