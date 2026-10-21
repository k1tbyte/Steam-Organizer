import { motionLevel, useDesktopLayout } from '@so/ui'
import { nextTick, onScopeDispose, shallowRef } from 'vue'
import { type RouteLocationNormalized, useRouter } from 'vue-router'

import { setRouteHero } from '#core'

import { pickRouteMotion, type RouteMotion } from '../services/routeMotion'
import { useShellNav } from './useShellNav'

/** Which motion the next route change plays; the shell's layers clear it once they settle. A hero
 *  change is the exception: it swaps the pages inside a View Transition instead. */
export function useRouteMotion() {
    const router = useRouter()
    const desktop = useDesktopLayout()
    const { main, settingsItem } = useShellNav()

    const motion = shallowRef<RouteMotion | null>(null)

    function pick(to: RouteLocationNormalized, from: RouteLocationNormalized) {
        const level = motionLevel()
        if (
            from.matched.length === 0 ||
            to.path === from.path ||
            level === 'off'
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
                level,
                morph: 'startViewTransition' in document,
            },
        )
    }

    // The navigation waits at `beforeResolve` until the browser has captured the old page, then
    // commits; `afterEach` lets the new page render before the second capture.
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
        const next = pick(to, from)
        motion.value = next?.kind === 'hero' ? null : next
        if (!done) return
        // Frames are frozen until `done`: a first visit mounts on the tick, its virtual rows on the next.
        await nextTick()
        await nextTick()
        done()
    })

    onScopeDispose(() => {
        disposed = true
        // A detached `afterEach` would never release a frozen document.
        swapped?.()
        stopResolve()
        stopAfter()
    })

    return motion
}
