import { computed, onScopeDispose, ref, watch } from 'vue'

export interface ResizeStop {
    name: string
    size: number
}

export interface UseResizableOptions {
    min: number
    max: number
    stops?: ResizeStop[]
    initial?: number
    side?: 'start' | 'end'
    step?: number
    label?: string
}

export const FREE = 'free'

/** Resizes a docked panel across a free range and exact-threshold named stops. */
export function useResizable(options: UseResizableOptions) {
    const {
        min,
        max,
        stops = [],
        side = 'end',
        step = 24,
        label = 'Resize',
    } = options

    const sizes = stops.map((stop) => stop.size)
    const smallest = Math.min(min, ...sizes)

    const rungs = sizes.filter((value) => value < min).sort((a, b) => a - b)
    rungs.push(min)
    const top = rungs.length - 1

    const initial = options.initial ?? min
    const size = ref(rungs.includes(initial) ? initial : clamp(initial))
    const dragging = ref(false)
    const restore = ref(size.value)

    watch(size, (value) => {
        if (value >= min) restore.value = value
    })

    const state = computed(
        () => stops.find((stop) => stop.size === size.value)?.name ?? FREE,
    )

    function clamp(value: number) {
        return Math.min(Math.max(value, min), max)
    }

    function rungOf(value: number) {
        if (value >= min) return top
        const index = rungs.indexOf(value)
        return index === -1 ? top : index
    }

    // Cross every exact threshold reached; gaps retain the current rung.
    function resolve(raw: number) {
        if (!Number.isFinite(raw)) return size.value

        let index = rungOf(size.value)

        let lower = rungs[index - 1]
        while (lower !== undefined && raw <= lower) {
            index -= 1
            lower = rungs[index - 1]
        }

        let upper = rungs[index + 1]
        while (upper !== undefined && raw >= upper) {
            index += 1
            upper = rungs[index + 1]
        }

        const rung = rungs[index]
        return index === top || rung === undefined ? clamp(raw) : rung
    }

    function setSize(value: number) {
        size.value = resolve(value)
    }

    const below = (value: number) =>
        sizes.filter((s) => s < value).sort((a, b) => b - a)[0]
    const above = (value: number) =>
        sizes.filter((s) => s > value).sort((a, b) => a - b)[0]

    // Keyboard steps rungs explicitly because small deltas cannot cross gaps.
    function stepBy(delta: number) {
        if (size.value >= min) {
            const next = size.value + delta
            size.value = next < min ? (below(min) ?? min) : clamp(next)
            return
        }
        size.value =
            delta > 0
                ? (above(size.value) ?? min)
                : (below(size.value) ?? size.value)
    }

    function toggle() {
        size.value =
            size.value >= min ? (below(min) ?? min) : clamp(restore.value)
    }

    let originCoord = 0
    let originSize = 0

    function onPointerdown(event: PointerEvent) {
        if (event.button !== 0) return
        const grip = event.currentTarget as HTMLElement
        grip.setPointerCapture(event.pointerId)

        // Anchoring at the grip center keeps every stop reachable from screen edges.
        const rect = grip.getBoundingClientRect()
        originCoord = rect.left + rect.width / 2
        originSize = size.value
        dragging.value = true
        document.documentElement.dataset.resizing = 'col'
        // Prevent selection and keep pointer use from leaving the grip focused.
        event.preventDefault()
    }

    function onPointermove(event: PointerEvent) {
        if (!dragging.value) return
        const delta = event.clientX - originCoord
        setSize(originSize + (side === 'end' ? delta : -delta))
    }

    function endDrag() {
        if (!dragging.value) return
        dragging.value = false
        delete document.documentElement.dataset.resizing
    }

    onScopeDispose(endDrag)

    function onKeydown(event: KeyboardEvent) {
        const grow = side === 'end' ? 'ArrowRight' : 'ArrowLeft'
        const shrink = side === 'end' ? 'ArrowLeft' : 'ArrowRight'

        if (event.key === grow) stepBy(step)
        else if (event.key === shrink) stepBy(-step)
        else if (event.key === 'Home') size.value = smallest
        else if (event.key === 'End') size.value = max
        else if (event.key === 'Enter') toggle()
        else return

        event.preventDefault()
    }

    const gripProps = computed(() => ({
        role: 'separator',
        tabindex: 0,
        'aria-orientation': 'vertical' as const,
        'aria-label': label,
        'aria-valuenow': Math.round(size.value),
        'aria-valuemin': smallest,
        'aria-valuemax': max,
        'data-state': state.value,
        'data-dragging': dragging.value ? '' : undefined,
        onPointerdown,
        onPointermove,
        onPointerup: endDrag,
        onPointercancel: endDrag,
        onLostpointercapture: endDrag,
        onKeydown,
    }))

    return { size, state, dragging, gripProps, setSize, toggle }
}
