import {
    type MaybeRefOrGetter,
    nextTick,
    onScopeDispose,
    toValue,
    watchEffect,
} from 'vue'
import { useRouter } from 'vue-router'

import { setScrollRoot, useScrollRoot } from '#core'

/** Publishes the shell's scroll container and restores it per route: router `scrollBehavior` only
 *  drives the window. Back/Forward return to the saved offset, a new page starts at the top,
 *  a query-only change (an overlay) leaves it alone. */
export function useShellScroll(
    el: MaybeRefOrGetter<HTMLElement | null | undefined>,
) {
    const router = useRouter()
    const root = useScrollRoot()
    const offsets = new Map<string, number>()
    let popped = false

    watchEffect(() => setScrollRoot(toValue(el) ?? null))

    // History listeners fire before the pop's guards run, so the flag is set in time.
    const stopListen = router.options.history.listen((_to, _from, info) => {
        popped = info.type === 'pop'
    })
    const stopBefore = router.beforeEach((to, from) => {
        if (to.path !== from.path && root.value)
            offsets.set(from.path, root.value.scrollTop)
    })
    const stopAfter = router.afterEach((to, from, failure) => {
        const restore = popped
        popped = false
        if (failure || to.path === from.path) return
        const top = restore ? (offsets.get(to.path) ?? 0) : 0
        const apply = () => root.value?.scrollTo({ top })
        // The next page renders on the tick; its height settles a frame later. A view transition
        // freezes frames while it swaps the pages, so the first pass cannot wait for one.
        void nextTick(() => {
            apply()
            requestAnimationFrame(apply)
        })
    })

    onScopeDispose(() => {
        stopListen()
        stopBefore()
        stopAfter()
        setScrollRoot(null)
    })
}
