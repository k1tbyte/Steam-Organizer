// Script-driven animations read the same tokens as CSS (motion.css).
import { onScopeDispose, type Ref, shallowRef } from 'vue'

function rootStyle(): CSSStyleDeclaration {
    return getComputedStyle(document.documentElement)
}

/** Milliseconds of a `--dur-*` token. */
export function durationToken(name: `--dur-${string}`): number {
    const value = rootStyle().getPropertyValue(name).trim()
    return Number.parseFloat(value) * (value.endsWith('ms') ? 1 : 1000)
}

/** The OS setting or the in-app toggle; CSS uses the `motion-reduce:` variant. */
export function prefersReducedMotion(): boolean {
    if (typeof document === 'undefined') return false
    return (
        document.documentElement.dataset.reduceMotion === 'true' ||
        matchMedia('(prefers-reduced-motion: reduce)').matches
    )
}

/** Reactive prefersReducedMotion() for script motion that outlives one frame. */
export function usePrefersReducedMotion(): Readonly<Ref<boolean>> {
    const reduced = shallowRef(prefersReducedMotion())
    if (typeof document === 'undefined') return reduced

    const update = () => {
        reduced.value = prefersReducedMotion()
    }
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, {
        attributeFilter: ['data-reduce-motion'],
    })
    media.addEventListener('change', update)
    onScopeDispose(() => {
        observer.disconnect()
        media.removeEventListener('change', update)
    })
    return reduced
}

/** A `--ease-*` token as a Web Animations easing. */
export function easingToken(name: `--ease-${string}`): string {
    return rootStyle().getPropertyValue(name).trim()
}
