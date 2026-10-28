import { useVirtualizer } from '@tanstack/vue-virtual'
import { useResizeObserver } from '@vueuse/core'
import {
    computed,
    type MaybeRefOrGetter,
    type Ref,
    ref,
    toValue,
    watch,
} from 'vue'

import { useScrollRoot } from '../page'
import { assignSlots } from './slots'

const OVERSCAN_ROWS = 6

// Layout offsets ignore transforms: the list may mount inside a page that is still sliding in.
export function offsetWithin(el: HTMLElement, scroller: HTMLElement): number {
    let top = 0
    let node: HTMLElement | null = el
    while (node && node !== scroller) {
        top += node.offsetTop
        node = node.offsetParent as HTMLElement | null
    }
    return top
}

/** Rows of one height windowed against the page's scroller. They key by slot: a row that scrolls in takes the nodes of one
 *  that left, so whatever a node holds for its row resets when the row changes. */
export function usePageRows<T>(
    rows: Ref<readonly T[]>,
    list: Ref<HTMLElement | null>,
    rowPx: MaybeRefOrGetter<number>,
    keyOf: (row: T) => string,
) {
    const root = useScrollRoot()
    // Where the list starts inside the scroller. Content above it (a hero gaining tags) moves it without resizing it,
    // but resizes the scroller's child that holds it.
    const margin = ref(0)
    const measure = () => {
        const el = list.value
        const scroller = root.value
        if (el && scroller) margin.value = offsetWithin(el, scroller)
    }
    const holder = () => {
        let el = list.value
        while (el && el.parentElement !== root.value) el = el.parentElement
        return el
    }
    useResizeObserver(
        () => [list.value, holder()].filter((el) => el !== null),
        measure,
    )
    watch([list, root], measure, { flush: 'post' })

    const virtualizer = useVirtualizer(
        computed(() => ({
            count: rows.value.length,
            getScrollElement: () => root.value,
            estimateSize: () => toValue(rowPx),
            getItemKey: (index: number) => {
                const row = rows.value[index]
                return row === undefined ? index : keyOf(row)
            },
            scrollMargin: margin.value,
            overscan: OVERSCAN_ROWS,
        })),
    )
    watch(
        () => toValue(rowPx),
        () => virtualizer.value.measure(),
    )

    // Each render carries the last assignment forward; only the keys depend on it.
    let slots = new Map<string, number>()
    return {
        totalSize: computed(() => virtualizer.value.getTotalSize()),
        items: computed(() => {
            const visible = virtualizer.value.getVirtualItems()
            slots = assignSlots(
                slots,
                visible.map((item) => String(item.key)),
            )
            return visible.flatMap((item) => {
                const row = rows.value[item.index]
                return row === undefined
                    ? []
                    : [
                          {
                              slot: slots.get(String(item.key)) ?? 0,
                              top: item.start - margin.value,
                              row,
                          },
                      ]
            })
        }),
    }
}
