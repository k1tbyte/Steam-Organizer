import { prefersReducedMotion, useDesktopLayout } from '@so/ui'
import { computed, onScopeDispose, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useAppearancePref, useScrollRoot } from '#core'

import { pickRouteMotion, type RouteMotion } from '../services/routeMotion'
import { useShellNav } from './useShellNav'

/** The page transition: which motion the next route change plays, and the hooks that keep the
 *  leaving page where it was while both pages share the one scroller. */
export function useRouteMotion() {
    const router = useRouter()
    const desktop = useDesktopLayout()
    const surface = useAppearancePref('surface')
    const root = useScrollRoot()
    const { main, settingsItem } = useShellNav()

    const motion = ref<RouteMotion | null>(null)
    const pageHeight = ref(0)
    // Pages of the latest navigation still animating: a page from an earlier one never clears its motion.
    const animating = new Set<Element>()

    // Runs after the route commits and before the pages render. A failed navigation or a query-only one
    // (an overlay) swaps no page, so it leaves a running transition alone.
    const stopAfter = router.afterEach((to, from, failure) => {
        if (failure || to.path === from.path) return
        animating.clear()
        pageHeight.value = root.value?.clientHeight ?? 0
        motion.value =
            from.matched.length === 0 || prefersReducedMotion()
                ? null
                : pickRouteMotion(
                      { path: to.path, nav: to.meta.nav },
                      { path: from.path, nav: from.meta.nav },
                      {
                          order: [...main.value, settingsItem.value].map(
                              (item) => item.key,
                          ),
                          desktop: desktop.value,
                          flat: surface.state.value === 'flat',
                      },
                  )
    })

    function start(el: Element) {
        animating.add(el)
    }
    function settle(el: Element) {
        if (animating.delete(el) && animating.size === 0) motion.value = null
    }

    // The leaving page leaves the flow: its top follows the scroller, so it stays where the user saw it.
    const unpins = new Map<Element, () => void>()
    function pin(el: Element) {
        start(el)
        const scroller = root.value
        if (!scroller) return
        const page = el as HTMLElement
        const seen = scroller.scrollTop
        const follow = () => {
            page.style.top = `${scroller.scrollTop - seen}px`
        }
        follow()
        scroller.addEventListener('scroll', follow, { passive: true })
        unpins.set(el, () => scroller.removeEventListener('scroll', follow))
    }
    function release(el: Element) {
        unpins.get(el)?.()
        unpins.delete(el)
        settle(el)
    }

    onScopeDispose(() => {
        stopAfter()
        for (const unpin of unpins.values()) unpin()
    })

    return {
        kind: computed(() => motion.value?.kind),
        animated: computed(() => motion.value !== null),
        style: computed(() =>
            motion.value
                ? {
                      '--route-dir': motion.value.dir,
                      '--page-h': `${pageHeight.value}px`,
                  }
                : undefined,
        ),
        hooks: {
            onBeforeEnter: start,
            onAfterEnter: settle,
            onEnterCancelled: settle,
            onBeforeLeave: pin,
            onAfterLeave: release,
            onLeaveCancelled: release,
        },
    }
}
