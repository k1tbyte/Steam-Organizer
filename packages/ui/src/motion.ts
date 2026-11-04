// Script-driven animations read the same tokens as CSS (motion.css).
import { type Ref, shallowRef } from 'vue'

// `root`: where the tokens are, the shadow host in a content script's UI (the page's <html> has none).
function rootStyle(
    root: Element = document.documentElement,
): CSSStyleDeclaration {
    return getComputedStyle(root)
}

/** Milliseconds of a `--dur-*` token. */
export function durationToken(name: `--dur-${string}`, root?: Element): number {
    const value = rootStyle(root).getPropertyValue(name).trim()
    return Number.parseFloat(value) * (value.endsWith('ms') ? 1 : 1000)
}

export type MotionLevel = 'gamify' | 'simple' | 'off'

/** The `data-motion` level on <html>; CSS uses the `motion-off:` / `motion-simple:` / `motion-on:` variants. */
export function motionLevel(): MotionLevel {
    if (typeof document === 'undefined') return 'gamify'
    const level = document.documentElement.dataset.motion
    return level === 'simple' || level === 'off' ? level : 'gamify'
}

// One observer for the app: an `auto` level can change under a mounted component.
const level = shallowRef<MotionLevel>('gamify')
let observed = false

/** motionLevel() as shared state, for script motion that must follow a live change. */
export function useMotionLevel(): Readonly<Ref<MotionLevel>> {
    if (!observed && typeof document !== 'undefined') {
        observed = true
        level.value = motionLevel()
        new MutationObserver(() => {
            level.value = motionLevel()
        }).observe(document.documentElement, {
            attributeFilter: ['data-motion'],
        })
    }
    return level
}

/** A `--ease-*` token as a Web Animations easing. */
export function easingToken(name: `--ease-${string}`, root?: Element): string {
    return rootStyle(root).getPropertyValue(name).trim()
}
