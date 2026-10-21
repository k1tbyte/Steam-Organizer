import { useElementBounding } from '@vueuse/core'
import { computed, type Ref } from 'vue'

import type { Box } from '../services/placement'

/** The viewport rectangle spanning `first` to `last`, kept current on scroll, resize and layout change. */
export function useAnchorBox(
    first: Ref<HTMLElement | undefined>,
    last: Ref<HTMLElement | undefined>,
) {
    const start = useElementBounding(first)
    const end = useElementBounding(last)
    return computed<Box>(() => ({
        top: start.top.value,
        left: start.left.value,
        width: end.right.value - start.left.value,
        height:
            Math.max(start.bottom.value, end.bottom.value) - start.top.value,
    }))
}
