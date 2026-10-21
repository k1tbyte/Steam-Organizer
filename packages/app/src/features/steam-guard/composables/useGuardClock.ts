import { computed, onScopeDispose, type Ref, shallowRef, watch } from 'vue'

import { usePageActive } from '#core'

const now = shallowRef(Date.now())
let users = 0
let interval: ReturnType<typeof setInterval> | undefined

/** One 1s clock for every visible code: a list of cards must not run an interval each. A page kept
 *  behind the current one reads a frozen time, and the clock stops with the last current reader. */
export function useGuardClock(): Readonly<Ref<number>> {
    const active = usePageActive()
    let joined = false
    function join(on: boolean) {
        if (on === joined) return
        joined = on
        if (!on) {
            if (--users === 0) clearInterval(interval)
        } else if (users++ === 0) {
            now.value = Date.now()
            interval = setInterval(() => {
                now.value = Date.now()
            }, 1000)
        }
    }
    watch(active, join, { immediate: true })
    onScopeDispose(() => join(false))

    let last = now.value
    return computed(() => {
        if (active.value) last = now.value
        return last
    })
}
