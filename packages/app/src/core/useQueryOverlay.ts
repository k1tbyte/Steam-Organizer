import {
    computed,
    type Ref,
    type ShallowRef,
    shallowRef,
    watch,
    watchEffect,
} from 'vue'
import { type RouteLocationRaw, useRoute, useRouter } from 'vue-router'

import { usePageActive } from './page'

interface QueryOverlayOptions<V extends string> {
    /** Accepted values: an unknown or bare one reads as the first, never a dead URL. */
    values?: readonly V[]
    /** Keys that live and die with the overlay. */
    owns?: readonly string[]
}

// History entries a close already popped: a second `back()` before popstate would leave the page.
const popped = new WeakSet<object>()

/** An overlay the URL opens, so a deep link, a reload and Back behave alike. The sole owner of
 *  `key`; without `values` the value is the raw string, '' for a bare flag. */
export function useQueryOverlay<const V extends string = string>(
    key: string,
    { values, owns = [] }: QueryOverlayOptions<V> = {},
) {
    const route = useRoute()
    const router = useRouter()
    // A page kept behind the current one still sees the live URL: it neither opens nor writes it.
    const active = usePageActive()

    const isOpen = computed(() => active.value && key in route.query)

    function read(): V {
        const raw = route.query[key]
        const value = (Array.isArray(raw) ? raw[0] : raw) ?? ''
        if (values === undefined || values.includes(value as V))
            return value as V
        return values[0] as V
    }

    // Held while closed, so the exit animation keeps its content.
    const held: ShallowRef<V> = shallowRef(read())
    watchEffect(() => {
        if (isOpen.value) held.value = read()
    })

    function to(value = values?.[0]): RouteLocationRaw {
        return {
            query: { ...route.query, [key]: value ?? null },
            hash: route.hash,
        }
    }

    /** Pushes when closed, so Back closes it; replaces when open (a section, an intent). */
    function show(value?: V) {
        if (isOpen.value) void router.replace(to(value))
        else void router.push(to(value))
    }

    /** Leaves to `target`, by default the page under the overlay. */
    function close(target?: RouteLocationRaw) {
        if (!isOpen.value) return
        // History already moved on (a pop the router is still landing): the overlay is leaving.
        const { history } = router.options
        if (canonical(history.location) !== canonical(route.fullPath)) return
        const query = { ...route.query }
        for (const owned of [key, ...owns]) delete query[owned]
        const next = canonical(target ?? { query, hash: route.hash })

        // Pop when `next` is the entry behind: replacing leaves the two identical, and Back dead.
        const { state } = history
        const { back } = state
        if (typeof back !== 'string' || canonical(back) !== next) {
            void router.replace(next)
            return
        }
        if (popped.has(state)) return
        popped.add(state)
        router.back()
    }

    // Re-serialized, so `%20` and `+` spell one location.
    function canonical(location: RouteLocationRaw): string {
        const { path, query, hash } = router.resolve(location)
        return router.resolve({ path, query, hash }).fullPath
    }

    const open = computed({
        get: () => isOpen.value,
        set: (value: boolean) => (value ? show() : close()),
    })

    return { open, value: computed(() => held.value), show, close, to }
}

/** Runs an overlay's submit and closes it on success, unless it was reopened meanwhile:
 *  Back closes even a busy overlay, and its late answer must not close the next opening. */
export function useCloseOnSuccess(open: Ref<boolean>) {
    let opening = 0
    watch(open, (isOpen) => {
        if (isOpen) opening += 1
    })

    return async (work: () => Promise<boolean>) => {
        const started = opening
        if ((await work()) && started === opening) open.value = false
    }
}
