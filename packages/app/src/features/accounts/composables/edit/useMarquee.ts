import { useEventListener } from '@vueuse/core'
import { computed, type Ref, watch } from 'vue'

import { useScrollRoot } from '#core'

import type { Account } from '../../model'
import { cardsIn, type Group, type GroupGeometry } from '../../services/reorder'
import { useEditSelection } from './useEditSelection'
import { useListDrag } from './useListDrag'

const clamp = (value: number, max: number) => Math.min(max, Math.max(0, value))

/** A rectangle a mouse sweeps from the page's empty space (a short list leaves most of it below): every card it touches joins the selection it started from, and Esc puts that one back.
 *  Hits are arithmetic over the group geometry, so cards scrolled out of the render count too. */
export function useMarquee(
    list: Ref<HTMLElement | null>,
    grid: {
        geometry: (group: Group) => GroupGeometry
        /** The group's cards as the screen shows them. */
        shown: (group: Group) => Account[]
        /** The list's size: the rectangle stays inside, or it would grow the scroll area. */
        bounds: () => { width: number; height: number }
    },
) {
    const selection = useEditSelection()
    const scroller = useScrollRoot()
    let base: ReadonlySet<string> = new Set()
    const sweep = useListDrag(list, {
        start() {
            base = selection.ids.value
        },
        end(dropped) {
            if (!dropped) selection.set(base)
        },
    })

    const rect = computed(() => {
        const from = sweep.origin.value
        const to = sweep.point.value
        if (!sweep.dragging.value || !from || !to) return null
        const { width, height } = grid.bounds()
        const x = [clamp(from.x, width), clamp(to.x, width)] as const
        const y = [clamp(from.y, height), clamp(to.y, height)] as const
        return {
            left: Math.min(...x),
            right: Math.max(...x),
            top: Math.min(...y),
            bottom: Math.max(...y),
        }
    })
    // Sync, so the release position counts before the sweep ends.
    watch(
        rect,
        (box) => {
            if (!box) return
            const next = new Set(base)
            for (const group of ['pinned', 'all'] as const) {
                const shown = grid.shown(group)
                for (const index of cardsIn(box, grid.geometry(group))) {
                    const account = shown[index]
                    if (account) next.add(account.id)
                }
            }
            selection.set(next)
        },
        { flush: 'sync' },
    )

    // Cards take their own presses.
    useEventListener(scroller, 'pointerdown', (event: PointerEvent) => {
        if (
            event.target instanceof Element &&
            event.target.closest('[data-id]')
        )
            return
        sweep.press(event, 'marquee', null, false)
    })

    return computed(() => {
        const box = rect.value
        return (
            box && {
                translate: `${box.left}px ${box.top}px`,
                width: `${box.right - box.left}px`,
                height: `${box.bottom - box.top}px`,
            }
        )
    })
}
