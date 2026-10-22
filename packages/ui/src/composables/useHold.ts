import { type MaybeRefOrGetter, onScopeDispose, shallowRef, toValue } from 'vue'

// Long enough for a swipe to turn into a scroll (pointercancel) before the hold shows.
const PAN_DELAY_MS = 100

interface HoldOptions {
    /** Milliseconds to hold before `onComplete`; without it the hold is a plain reveal. */
    duration?: MaybeRefOrGetter<number | undefined>
    onComplete?: () => void
    disabled?: MaybeRefOrGetter<boolean | undefined>
    /** The element lets touch scroll (`touch-pan-y`, not `touch-none`): a touch hold starts a beat late, so a swipe from it never flashes. */
    pans?: boolean
}

/** Press and hold on a pointer or Space/Enter; letting go, leaving or blurring cancels. */
export function useHold({
    duration,
    onComplete,
    disabled,
    pans,
}: HoldOptions = {}) {
    const holding = shallowRef(false)
    let timer: ReturnType<typeof setTimeout> | undefined

    function stop() {
        clearTimeout(timer)
        timer = undefined
        holding.value = false
    }

    function start() {
        if (holding.value || toValue(disabled)) return
        holding.value = true
        const ms = toValue(duration)
        if (ms === undefined) return
        timer = setTimeout(() => {
            const blocked = toValue(disabled)
            stop()
            if (!blocked) onComplete?.()
        }, ms)
    }

    onScopeDispose(stop)

    const isPress = (event: KeyboardEvent) =>
        event.key === ' ' || event.key === 'Enter'

    /** Spread on the pressable element, which should also set `select-none` and `touch-none` (or `touch-pan-y` with `pans`). */
    const handlers = {
        onPointerdown: (event: PointerEvent) => {
            if (event.button !== 0) return
            // A touch pointer is captured by its target, which hides the finger sliding away.
            const target = event.target as Element | null
            target?.releasePointerCapture?.(event.pointerId)
            if (pans && event.pointerType === 'touch' && !holding.value) {
                clearTimeout(timer)
                timer = setTimeout(start, PAN_DELAY_MS)
            } else start()
        },
        onPointerup: stop,
        onPointerleave: stop,
        onPointercancel: stop,
        onBlur: stop,
        // A long press would open the platform's context menu mid-hold; a right-click starts no hold and stays the page's.
        onContextmenu: (event: Event) => {
            if (holding.value || timer !== undefined) event.preventDefault()
        },
        onKeydown: (event: KeyboardEvent) => {
            if (!isPress(event)) return
            event.preventDefault()
            if (!event.repeat) start()
        },
        onKeyup: (event: KeyboardEvent) => {
            if (isPress(event)) stop()
        },
    }

    return { holding, handlers, stop }
}
