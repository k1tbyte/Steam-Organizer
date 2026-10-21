import { useHold } from '@so/ui'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

import { useCopyFeedback } from '#core'

import {
    demoGuardCode,
    GUARD_PERIOD_S,
    guardPhase,
    MASKED_CODE,
} from '../services/guardCode'
import { useGuardClock } from './useGuardClock'

/** One account's Steam Guard control: masked until held, a countdown to the next code, copy. */
export function useGuardCode(seed: MaybeRefOrGetter<string>) {
    const clock = useGuardClock()
    const { holding, handlers } = useHold()
    const { copied, copy } = useCopyFeedback()

    const phase = computed(() => guardPhase(clock.value))
    const codeAt = (nowMs: number) =>
        demoGuardCode(toValue(seed), guardPhase(nowMs).period)

    return {
        holding,
        handlers,
        copied,
        // Computed only while held: masked cards never hash.
        shown: computed(() =>
            holding.value ? codeAt(clock.value) : MASKED_CODE,
        ),
        remaining: computed(() => phase.value.remaining / GUARD_PERIOD_S),
        // The 1s clock can lag a rollover, so a copy reads the real time.
        copyCode: () => copy(codeAt(Date.now())),
    }
}
