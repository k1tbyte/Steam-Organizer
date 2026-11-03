import { storeToRefs } from 'pinia'
import { computed } from 'vue'

import { CARD_MIN_WIDTH_PX, cardHeightCss } from '../../services/cardLayout'
import { useCardFieldsStore } from '../../stores/cardFields'
import { useCardMetrics } from '../useCardMetrics'

// Enough to fill the first screen at the widest column count, no more.
const DESKTOP_CARDS = 9
const PHONE_CARDS = 4

/** Placeholder cards while the vault's contents open: the grid's columns, gap and card height, so the list lands in place. */
export function useListSkeleton() {
    const { flags } = storeToRefs(useCardFieldsStore())
    const metrics = useCardMetrics(flags)
    return {
        cards: computed(() =>
            Array.from(
                { length: metrics.touch.value ? PHONE_CARDS : DESKTOP_CARDS },
                (_, index) => index,
            ),
        ),
        gridStyle: computed(() => {
            const gap = `calc(var(--density-unit) * ${metrics.gapUnits.value})`
            return {
                gridTemplateColumns: `repeat(auto-fill, minmax(min(${CARD_MIN_WIDTH_PX}px, 100%), 1fr))`,
                gap,
            }
        }),
        cardHeight: computed(() =>
            cardHeightCss(flags.value, metrics.touch.value),
        ),
    }
}
