import { ref, watch } from 'vue'

/** True for one `animate-bump` after `source` changes; never on mount. */
export function useBump(source: () => unknown) {
    const bumping = ref(false)
    watch(source, () => {
        // Drop the class for a frame so a quick second change restarts the animation.
        bumping.value = false
        requestAnimationFrame(() => {
            bumping.value = true
        })
    })
    return { bumping, settle: () => (bumping.value = false) }
}
