import { nextTick, onScopeDispose, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useScrollTop } from '#core'

import { createDockScroll } from '../services/dockScroll'

/** Phone dock visibility: hides on scroll down and returns on scroll up, near the top and on navigation. */
export function useDock() {
    const router = useRouter()
    const top = useScrollTop()
    const dock = createDockScroll()
    const hidden = ref(false)
    // A switch jumps to the next page's own offset a frame after the route renders: not the user scrolling.
    let settling = false

    function reveal() {
        dock.reset(top.value)
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

    watch(top, (y) => {
        if (!settling) hidden.value = dock.scroll(y)
    })

    settle()
    const stop = router.afterEach((to, from, failure) => {
        if (!failure && to.path !== from.path) settle()
    })
    onScopeDispose(stop)

    return { hidden, reveal }
}
