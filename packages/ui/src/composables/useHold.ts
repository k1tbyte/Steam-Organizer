import { type MaybeRefOrGetter, onScopeDispose, shallowRef, toValue } from 'vue'

interface HoldOptions {
    /** Milliseconds to hold before `onComplete`; without it the hold is a plain reveal. */
    duration?: MaybeRefOrGetter<number | undefined>
    onComplete?: () => void
    disabled?: MaybeRefOrGetter<boolean | undefined>
}

/** Press and hold on a pointer or Space/Enter; letting go, leaving or blurring cancels. */
export function useHold({ duration, onComplete, disabled }: HoldOptions = {}) {
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

    /** Spread on the pressable element, which should also set `touch-none select-none`. */
    const handlers = {
        onPointerdown: (event: PointerEvent) => {
            if (event.button !== 0) return
            // A touch pointer is captured by its target, which hides the finger sliding away.
            const target = event.target as Element | null
            target?.releasePointerCapture?.(event.pointerId)
            start()
        },
        onPointerup: stop,
        onPointerleave: stop,
        onPointercancel: stop,
        onBlur: stop,
        // A touch hold would otherwise open the browser's context menu.
        onContextmenu: (event: Event) => event.preventDefault(),
        onKeydown: (event: KeyboardEvent) => {
            if (!isPress(event)) return
            event.preventDefault()
            if (!event.repeat) start()
        },
        onKeyup: (event: KeyboardEvent) => {
            if (isPress(event)) stop()
        },
    }

    return { holding, handlers }
}
