import { useHold } from '@so/ui'
import { computed, type MaybeRefOrGetter, toValue, watch } from 'vue'

import { useCopyFeedback } from '#core'

import {
    GUARD_PERIOD_S,
    guardCodeAt,
    guardPhase,
    MASKED_CODE,
} from '../services/guardCode'
import { useGuardClock } from './useGuardClock'

/** One account's Steam Guard control: masked until held, a countdown to the next code, copy. */
export function useGuardCode(seed: MaybeRefOrGetter<string>) {
    const clock = useGuardClock()
    const { holding, handlers, stop } = useHold({ pans: true })
    const { copied, copy, reset } = useCopyFeedback()
    // A recycled list card hands this control to another account mid-hold.
    watch(
        () => toValue(seed),
        () => {
            stop()
            reset()
        },
    )

    const phase = computed(() => guardPhase(clock.value))
    const currentCode = () => guardCodeAt(toValue(seed))

    return {
        holding,
        handlers,
        copied,
        // Computed only while held: masked cards never hash.
        shown: computed(() =>
            holding.value
                ? guardCodeAt(toValue(seed), clock.value)
                : MASKED_CODE,
        ),
        remaining: computed(() => phase.value.remaining / GUARD_PERIOD_S),
        currentCode,
        copyCode: () => copy(currentCode()),
    }
}
