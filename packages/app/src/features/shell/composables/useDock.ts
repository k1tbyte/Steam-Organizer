import { nextTick, onScopeDispose, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

import { useScrollRoot } from '#core'

import { createDockScroll } from '../services/dockScroll'

/** Phone dock visibility: hides on scroll down and returns on scroll up, near the top and on navigation. */
export function useDock() {
    const router = useRouter()
    const root = useScrollRoot()
    const dock = createDockScroll()
    const hidden = ref(false)
    // The shell restores a position a frame after a route renders: that jump is not the user scrolling.
    let settling = false

    function reveal() {
        dock.reset(root.value?.scrollTop ?? 0)
        hidden.value = false
    }

    function settle() {
        settling = true
        reveal()
        void nextTick(() =>
            requestAnimationFrame(() =>
                requestAnimationFrame(() => {
                    settling = false
                    reveal()
                }),
            ),
        )
    }

    function onScroll() {
        if (root.value && !settling)
            hidden.value = dock.scroll(root.value.scrollTop)
    }

    watchEffect((onCleanup) => {
        const el = root.value
        if (!el) return
        el.addEventListener('scroll', onScroll, { passive: true })
        onCleanup(() => el.removeEventListener('scroll', onScroll))
    })

    settle()
    const stop = router.afterEach((to, from, failure) => {
        if (!failure && to.path !== from.path) settle()
    })
    onScopeDispose(stop)

    return { hidden, reveal }
}
