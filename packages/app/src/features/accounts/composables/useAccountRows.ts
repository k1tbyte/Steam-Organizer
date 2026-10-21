import { useVirtualizer } from '@tanstack/vue-virtual'
import { useElementSize } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, type Ref, ref, watch } from 'vue'

import { useScrollRoot } from '#core'

import type { Account } from '../model'
import { buildRows, columnsFor, rowHeight } from '../services/listRows'
import { useCardFieldsStore } from '../stores/cardFields'
import { useCardMetrics } from './useCardMetrics'

const OVERSCAN_ROWS = 3

/** The list as virtual rows of cards against the shell's scroll container. The column count follows the list's width and row heights come from the card layout, so no row is ever measured. */
export function useAccountRows(
    source: { pinned: Ref<Account[]>; rest: Ref<Account[]> },
    list: Ref<HTMLElement | null>,
) {
    const { flags } = storeToRefs(useCardFieldsStore())
    const metrics = useCardMetrics(flags)
    const root = useScrollRoot()
    const { width } = useElementSize(list)

    const gap = computed(() => metrics.gapUnits.value * metrics.unit.value)
    const columns = computed(() => columnsFor(width.value, gap.value))
    const rows = computed(() =>
        buildRows(source.pinned.value, source.rest.value, columns.value),
    )
    const sizes = computed(() => ({
        unit: metrics.unit.value,
        gapUnits: metrics.gapUnits.value,
        cardPx: metrics.cardPx.value,
    }))

    // Where the list starts inside the scroller: the filter strip sits above it.
    const margin = ref(0)
    watch(
        [list, root, width],
        () => {
            const el = list.value
            const scroller = root.value
            if (!el || !scroller) return
            margin.value =
                el.getBoundingClientRect().top -
                scroller.getBoundingClientRect().top +
                scroller.scrollTop
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

    return {
        flags,
        touch: metrics.touch,
        rowStyle: computed(() => ({
            gridTemplateColumns: `repeat(${columns.value}, minmax(0, 1fr))`,
            columnGap: `calc(var(--density-unit) * ${metrics.gapUnits.value})`,
        })),
        margin,
        totalSize: computed(() => virtualizer.value.getTotalSize()),
        items: computed(() =>
            virtualizer.value.getVirtualItems().flatMap((item) => {
                const row = rows.value[item.index]
                return row
                    ? [
                          {
                              key: String(item.key),
                              start: item.start,
                              size: item.size,
                              row,
                          },
                      ]
                    : []
            }),
        ),
    }
}
