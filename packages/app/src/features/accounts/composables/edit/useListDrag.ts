import { useEventListener } from '@vueuse/core'
import { computed, onScopeDispose, type Ref, shallowRef, watch } from 'vue'

import { useScrollRoot, useScrollTop } from '#core'

// A mouse press becomes a drag past this; touch lifts at once from the handle.
const SLOP_PX = 4
// Auto-scroll zone at the scroller's top and bottom, and its fastest step per frame.
const EDGE_PX = 64
const STEP_PX = 16

interface Grip {
    id: string
    pointerId: number
    /** Where the pointer holds the card, from its corner; zero on the list itself. */
    grab: { x: number; y: number }
    /** The list's and the scroller's client boxes and the scroll range, read once at the press. */
    list: { left: number; top: number }
    edges: { top: number; bottom: number }
    scroll: number
    maxScroll: number
    from: { x: number; y: number }
}

/** One pointer dragging over the list, a card or a rectangle from its empty space: the pointer and the card's corner in list coordinates,
 *  auto-scroll near the scroller's edges, Esc cancelling. Layout is read at the press only; then both follow the pointer and the scroll offset. */
export function useListDrag(
    list: Readonly<Ref<HTMLElement | null>>,
    hooks: { start: (id: string) => void; end: (dropped: boolean) => void },
) {
    const scroller = useScrollRoot()
    const top = useScrollTop()
    const grip = shallowRef<Grip | null>(null)
    const moving = shallowRef(false)
    const pointer = shallowRef({ x: 0, y: 0 })
    // The offset the drag follows: an auto-scroll step lands here at once, a frame before its scroll event.
    const offset = shallowRef(0)
    watch(
        top,
        (value) => {
            offset.value = value
        },
        { immediate: true, flush: 'sync' },
    )

    const point = computed(() => {
        const held = grip.value
        if (!held) return null
        return {
            x: pointer.value.x - held.list.left,
            y: pointer.value.y - held.list.top + offset.value - held.scroll,
        }
    })

    // The wheel takes over from auto-scroll until the pointer moves again.
    let steering = false

    // Hooks run in the event that starts or ends the drag, so the caller sees every pointer position in between;
    // start runs before anything sees the drag moving (a sync watcher would act on the state start sets up).
    function lift(held: Grip) {
        hooks.start(held.id)
        moving.value = true
    }
    function end(dropped: boolean) {
        if (!grip.value) return
        if (moving.value) hooks.end(dropped)
        grip.value = null
        moving.value = false
    }

    /** `slot` is the card's corner in list coordinates, null for the list itself; touch and pen drag from the handle only, so a swipe scrolls. */
    function press(
        event: PointerEvent,
        id: string,
        slot: { x: number; y: number } | null,
        handle: boolean,
    ) {
        const touch = event.pointerType !== 'mouse'
        if (
            event.button !== 0 ||
            grip.value ||
            (touch && !handle) ||
            !list.value ||
            !scroller.value
        )
            return
        event.preventDefault()
        const box = list.value.getBoundingClientRect()
        const edges = scroller.value.getBoundingClientRect()
        grip.value = {
            id,
            pointerId: event.pointerId,
            grab: slot
                ? {
                      x: event.clientX - box.left - slot.x,
                      y: event.clientY - box.top - slot.y,
                  }
                : { x: 0, y: 0 },
            list: { left: box.left, top: box.top },
            edges: { top: edges.top, bottom: edges.bottom },
            scroll: top.value,
            maxScroll:
                scroller.value.scrollHeight - scroller.value.clientHeight,
            from: { x: event.clientX, y: event.clientY },
        }
        pointer.value = { x: event.clientX, y: event.clientY }
        steering = false
        if (touch) lift(grip.value)
    }

    const own = (event: PointerEvent) =>
        grip.value?.pointerId === event.pointerId
    useEventListener(window, 'pointermove', (event: PointerEvent) => {
        const held = grip.value
        if (!held || !own(event)) return
        pointer.value = { x: event.clientX, y: event.clientY }
        steering = true
        if (
            !moving.value &&
            Math.hypot(
                event.clientX - held.from.x,
                event.clientY - held.from.y,
            ) > SLOP_PX
        )
            lift(held)
    })
    useEventListener(window, 'pointerup', (event: PointerEvent) => {
        if (!own(event)) return
        // The release may land past the last move: the drop takes its own position.
        pointer.value = { x: event.clientX, y: event.clientY }
        end(true)
    })
    useEventListener(
        window,
        'pointercancel',
        (event: PointerEvent) => own(event) && end(false),
    )
    useEventListener(
        window,
        'wheel',
        () => {
            steering = false
        },
        { passive: true },
    )
    // Capture, so the edit bar's Esc, which clears the selection or leaves the mode, sees it handled.
    useEventListener(
        window,
        'keydown',
        (event: KeyboardEvent) => {
            if (event.key !== 'Escape' || !moving.value) return
            event.preventDefault()
            end(false)
        },
        { capture: true },
    )

    // Scrolls while the pointer rests near an edge, faster the deeper it is.
    let frame = 0
    function step() {
        const held = grip.value
        const el = scroller.value
        if (!held || !el) return
        const y = pointer.value.y
        const depth =
            Math.max(0, held.edges.top + EDGE_PX - y) -
            Math.max(0, y - held.edges.bottom + EDGE_PX)
        if (depth !== 0 && steering) {
            const by = Math.ceil(
                Math.min(STEP_PX, (Math.abs(depth) / EDGE_PX) * STEP_PX),
            )
            offset.value = Math.min(
                held.maxScroll,
                Math.max(0, offset.value - Math.sign(depth) * by),
            )
            el.scrollTop = offset.value
        }
        frame = requestAnimationFrame(step)
    }
    watch(moving, (on) => {
        cancelAnimationFrame(frame)
        if (on) frame = requestAnimationFrame(step)
    })
    onScopeDispose(() => cancelAnimationFrame(frame))

    return {
        /** The card being dragged, once the press became a drag. */
        dragging: computed(() =>
            moving.value ? (grip.value?.id ?? null) : null,
        ),
        /** A pointer holds a card (a mouse press may not be a drag yet). */
        held: computed(() => grip.value !== null),
        /** The pointer in list coordinates. */
        point,
        /** Where the press landed, in list coordinates. */
        origin: computed(() => {
            const held = grip.value
            return held
                ? {
                      x: held.from.x - held.list.left,
                      y: held.from.y - held.list.top,
                  }
                : null
        }),
        /** The dragged card's top-left corner in list coordinates. */
        corner: computed(() => {
            const at = point.value
            const held = grip.value
            return at && held
                ? { x: at.x - held.grab.x, y: at.y - held.grab.y }
                : null
        }),
        press,
        cancel: () => end(false),
    }
}
