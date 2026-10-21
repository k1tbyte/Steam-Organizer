import { prefersReducedMotion, useDesktopLayout } from '@so/ui'
import { computed, nextTick, onScopeDispose, ref } from 'vue'
import { type RouteLocationNormalized, useRouter } from 'vue-router'

import { setRouteHero, useAppearancePref, useScrollRoot } from '#core'

import { pickRouteMotion, type RouteMotion } from '../services/routeMotion'
import { useShellNav } from './useShellNav'

/** The page transition: which motion the next route change plays, and the hooks that keep the
 *  leaving page where it was while both pages share the one scroller. A hero change is the
 *  exception: it swaps the pages inside a View Transition instead. */
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

    function pick(to: RouteLocationNormalized, from: RouteLocationNormalized) {
        if (
            from.matched.length === 0 ||
            to.path === from.path ||
            prefersReducedMotion()
        )
            return null
        return pickRouteMotion(
            { path: to.path, nav: to.meta.nav, hero: to.meta.hero },
            { path: from.path, nav: from.meta.nav, hero: from.meta.hero },
            {
                order: [...main.value, settingsItem.value].map(
                    (item) => item.key,
                ),
                desktop: desktop.value,
                flat: surface.state.value === 'flat',
                morph: 'startViewTransition' in document,
            },
        )
    }

    // The navigation waits at `beforeResolve` until the browser has captured the old page, then
    // commits; `afterEach` lets the new page render and the scroll settle before the second capture.
    let swapped: (() => void) | null = null
    // A skipped transition still finishes: only the latest one may clear the shared hero state.
    let latestHero = 0
    let disposed = false
    const stopResolve = router.beforeResolve((to, from) => {
        const next = pick(to, from)
        if (next?.kind !== 'hero') return
        const id = ++latestHero
        const page = to.meta.hero ? to : from
        setRouteHero(String(page.params.id))
        const html = document.documentElement
        html.dataset.routeMotion = next.dir === 1 ? 'hero-open' : 'hero-close'
        return new Promise<void>((captured) => {
            const transition = document.startViewTransition(
                () =>
                    new Promise<void>((done) => {
                        if (disposed) done()
                        else swapped = done
                        captured()
                    }),
            )
            void transition.finished.finally(() => {
                captured()
                if (id !== latestHero) return
                delete html.dataset.routeMotion
                setRouteHero(null)
            })
        })
    })

    // Runs after the route commits and before the pages render. A failed navigation or a query-only one
    // (an overlay) swaps no page, so it leaves a running transition alone.
    const stopAfter = router.afterEach(async (to, from, failure) => {
        const done = swapped
        swapped = null
        if (failure || to.path === from.path) {
            done?.()
            return
        }
        animating.clear()
        pageHeight.value = root.value?.clientHeight ?? 0
        const next = pick(to, from)
        motion.value = next?.kind === 'hero' ? null : next
        if (!done) return
        // Frames are frozen until `done`: the shell restores the scroll on the tick, but a virtual list
        // only follows a scroll event, which a frozen document never fires.
        await nextTick()
        await nextTick()
        root.value?.dispatchEvent(new Event('scroll'))
        await nextTick()
        done()
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
        disposed = true
        // A detached `afterEach` would never release a frozen document.
        swapped?.()
        stopResolve()
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
