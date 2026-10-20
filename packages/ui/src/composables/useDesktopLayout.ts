import { type Ref, type ShallowRef, shallowRef } from 'vue'

// One listener for the app's lifetime: the breakpoint is static, and a per-call
// matchMedia plus getComputedStyle would cost every list item a style flush.
let desktop: ShallowRef<boolean> | undefined

/** Width from `--breakpoint-lg` up, where CSS applies `lg:`; false on the server. */
export function useDesktopLayout(): Readonly<Ref<boolean>> {
    if (typeof document === 'undefined') return shallowRef(false)
    if (desktop) return desktop

    const width = getComputedStyle(document.documentElement)
        .getPropertyValue('--breakpoint-lg')
        .trim()
    const media = matchMedia(`(width >= ${width})`)
    const state = shallowRef(media.matches)
    media.addEventListener('change', () => {
        state.value = media.matches
    })
    desktop = state
    return state
}
