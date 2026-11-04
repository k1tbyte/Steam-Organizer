import { onScopeDispose, type Ref, shallowRef } from 'vue'

const MINUTE_MS = 60_000

// One clock for every reader: an age label moves once a minute.
const now = shallowRef(Date.now())
let readers = 0
let clock: ReturnType<typeof setInterval> | undefined

/** `Date.now()`, moved on once a minute while any scope reads it. */
export function useMinuteClock(): Readonly<Ref<number>> {
    if (readers++ === 0) {
        now.value = Date.now()
        clock = setInterval(() => {
            now.value = Date.now()
        }, MINUTE_MS)
    }
    onScopeDispose(() => {
        if (--readers === 0) clearInterval(clock)
    })
    return now
}
