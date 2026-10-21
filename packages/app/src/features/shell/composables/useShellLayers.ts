import { computed, nextTick, onScopeDispose, type Ref, shallowRef } from 'vue'
import { type RouteLocationNormalizedLoaded, useRouter } from 'vue-router'

import { useRouteMotion } from './useRouteMotion'

export type LayerState = 'active' | 'enter' | 'leave' | 'hidden'

interface Layer {
    key: string
    route: RouteLocationNormalizedLoaded
}

/** The shell's pages: every visited section root (`meta.resident`) stays mounted in its own layer,
 *  any other page lives only while current. A switch moves two layers that already exist. */
export function useShellLayers(stage: Ref<HTMLElement | null>) {
    const router = useRouter()
    const motion = useRouteMotion()

    // Appended in visit order and never reordered: moving a layer's node would reset its scroll.
    const residents = shallowRef<Layer[]>([])
    const transient = shallowRef<Layer | null>(null)
    const leaving = shallowRef<Layer | null>(null)
    const current = shallowRef('')
    const previous = shallowRef<string | null>(null)
    let latest = 0

    function settle() {
        previous.value = null
        leaving.value = null
    }

    function enter(to: RouteLocationNormalizedLoaded) {
        const id = ++latest
        const from = current.value
        settle()
        leaving.value = transient.value
        transient.value = null
        const layer = { key: to.path, route: to }
        if (!to.meta.resident) transient.value = layer
        else if (!residents.value.some((r) => r.key === to.path))
            residents.value = [...residents.value, layer]
        current.value = to.path
        if (!motion.value || !from) return settle()
        previous.value = from
        void settleAfterMotion(id)
    }

    // Both layers move on CSS keyframes; the switch settles when the last of them ends.
    async function settleAfterMotion(id: number) {
        await nextTick()
        const moving = stage.value?.querySelectorAll<HTMLElement>(
            ':scope > :is([data-layer="enter"], [data-layer="leave"])',
        )
        const animations = [...(moving ?? [])].flatMap((el) =>
            el.getAnimations(),
        )
        await Promise.all(animations.map((a) => a.finished.catch(() => null)))
        if (id !== latest) return
        settle()
        motion.value = null
    }

    enter(router.currentRoute.value)
    // A route outside the shell (the vault pages) unmounts it instead.
    const stop = router.afterEach((to, from, failure) => {
        if (!failure && to.path !== from.path && to.matched[1]) enter(to)
    })
    onScopeDispose(stop)

    const layers = computed(() => [
        ...residents.value,
        ...(leaving.value ? [leaving.value] : []),
        ...(transient.value ? [transient.value] : []),
    ])

    function stateOf(key: string): LayerState {
        if (key === current.value) return previous.value ? 'enter' : 'active'
        return key === previous.value ? 'leave' : 'hidden'
    }

    return {
        layers,
        stateOf,
        kind: computed(() => motion.value?.kind),
        style: computed(() =>
            motion.value ? { '--route-dir': motion.value.dir } : undefined,
        ),
    }
}
