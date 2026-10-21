import {
    onMounted,
    onScopeDispose,
    readonly,
    ref,
    type WatchSource,
    watch,
} from 'vue'
import { motionLevel } from '../motion'

/** Scrolls a horizontal strip so its active item sits centered; the browser clamps at both ends.
 *  One layout read per selection, resize or item change, never per frame. `overflows` says whether the items
 *  outgrow the strip: make it a scroll container only then, or an overshooting indicator inside
 *  grows the scroll area and flashes a scrollbar on every switch. */
export function useCenterActive(
    strip: () => HTMLElement | null | undefined,
    active: WatchSource,
    selector: string,
    items: WatchSource,
) {
    const overflows = ref(false)

    function center(behavior: ScrollBehavior) {
        const el = strip()
        const item = el?.querySelector<HTMLElement>(selector)
        if (!el || !item || el.scrollWidth <= el.clientWidth) return
        // Rects carry ancestor transforms (a modal scaling in); scroll metrics do not.
        const box = el.getBoundingClientRect()
        const scale = box.width / el.offsetWidth || 1
        const offset = (item.getBoundingClientRect().left - box.left) / scale
        el.scrollTo({
            left:
                el.scrollLeft +
                offset -
                (el.clientWidth - item.offsetWidth) / 2,
            behavior,
        })
    }

    function measure() {
        const el = strip()
        overflows.value = !!el && el.scrollWidth > el.clientWidth
    }
    // Measured on a resize or an item change, not on a switch: an indicator in flight would count.
    // Measured on a resize or new items, never while an indicator is in flight.
    const observer =
        typeof ResizeObserver === 'undefined'
            ? null
            : new ResizeObserver(measure)

    onMounted(() => {
        const el = strip()
        if (el) observer?.observe(el)
    })
    onScopeDispose(() => observer?.disconnect())

    // An item added to a full strip grows its content, not its box.
    watch(items, measure, { flush: 'post' })
    watch(overflows, (now) => now && center('instant'), { flush: 'post' })
    watch(
        active,
        () => center(motionLevel() === 'off' ? 'instant' : 'smooth'),
        {
            flush: 'post',
        },
    )

    return { overflows: readonly(overflows) }
}
