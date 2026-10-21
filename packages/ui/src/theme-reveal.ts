// A theme change: a circular reveal from `origin` (Gamify), a crossfade (Simple), instant otherwise.
import { nextTick } from 'vue'

import { durationToken, easingToken, motionLevel } from './motion'

export type RevealOrigin =
    | MouseEvent
    | HTMLElement
    | { x: number; y: number }
    | undefined

type Point = { x: number; y: number }

export async function revealThemeChange(
    apply: () => void,
    origin: RevealOrigin,
) {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
        apply()
        return
    }

    // The `theme` type scopes the root overrides in base.css (Safari 18.2+).
    const typed =
        typeof ViewTransition !== 'undefined' &&
        'types' in ViewTransition.prototype
    const level = motionLevel()
    if (!typed || level === 'off') {
        apply()
        return
    }

    const { x, y } = toPoint(origin)
    const transition = document.startViewTransition({
        update: async () => {
            apply()
            await nextTick()
        },
        types: ['theme'],
    })

    try {
        await transition.ready
    } catch {
        // A newer transition owns the reveal.
        return
    }

    const pseudoElement = '::view-transition-new(root)'
    if (level === 'simple') {
        document.documentElement.animate(
            { opacity: [0, 1] },
            {
                duration: durationToken('--dur-base'),
                easing: easingToken('--ease-out'),
                pseudoElement,
            },
        )
        return
    }
    const radius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
    )
    document.documentElement.animate(
        {
            clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${radius}px at ${x}px ${y}px)`,
            ],
        },
        {
            duration: durationToken('--dur-reveal'),
            easing: easingToken('--ease-in-out'),
            pseudoElement,
        },
    )
}

function toPoint(origin: RevealOrigin): Point {
    if (!origin) return { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    if (origin instanceof HTMLElement) return centerOf(origin)
    if ('clientX' in origin) {
        // Keyboard clicks use the control center instead of synthetic (0,0).
        if (origin.detail === 0 && origin.target instanceof HTMLElement) {
            return centerOf(origin.target)
        }
        return { x: origin.clientX, y: origin.clientY }
    }
    return origin
}

function centerOf(el: HTMLElement): Point {
    const rect = el.getBoundingClientRect()
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}
