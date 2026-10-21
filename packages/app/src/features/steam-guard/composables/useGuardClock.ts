import { onScopeDispose, type Ref, shallowRef } from 'vue'

const now = shallowRef(Date.now())
let users = 0
let interval: ReturnType<typeof setInterval> | undefined

/** One 1s clock for every visible code: a list of cards must not run an interval each. It stops with the last reader. */
export function useGuardClock(): Readonly<Ref<number>> {
    if (users++ === 0) {
        now.value = Date.now()
        interval = setInterval(() => {
            now.value = Date.now()
        }, 1000)
    }
    onScopeDispose(() => {
        if (--users === 0) clearInterval(interval)
    })
    return now
}
