import { useVirtualizer } from '@tanstack/vue-virtual'
import { computed, type Ref, watch } from 'vue'

import type { Account } from '#features/accounts'

const ROW_GAP_PX = 1
const OVERSCAN_ROWS = 6

/** The picker's rows, windowed against their scroller: a vault of thousands never mounts them all. */
export function usePickerRows(
    rows: Ref<Account[]>,
    scroller: Ref<HTMLElement | null>,
    revealed: Ref<{ index: number }>,
    rowPx: Ref<number>,
    inset: Ref<{ start: number; end: number }>,
) {
    const virtualizer = useVirtualizer(
        computed(() => ({
            count: rows.value.length,
            getScrollElement: () => scroller.value,
            estimateSize: () => rowPx.value,
            gap: ROW_GAP_PX,
            paddingStart: inset.value.start,
            paddingEnd: inset.value.end,
            getItemKey: (index: number) => rows.value[index]?.id ?? index,
            overscan: OVERSCAN_ROWS,
        })),
    )

    // After the render, so the virtualizer already measures the new rows.
    watch(
        revealed,
        ({ index }) => {
            virtualizer.value.scrollToIndex(index, { align: 'auto' })
        },
        { flush: 'post' },
    )

    return {
        totalSize: computed(() => virtualizer.value.getTotalSize()),
        items: computed(() =>
            virtualizer.value.getVirtualItems().flatMap((item) => {
                const account = rows.value[item.index]
                return account
                    ? [
                          {
                              key: account.id,
                              start: item.start,
                              index: item.index,
                              account,
                          },
                      ]
                    : []
            }),
        ),
    }
}
