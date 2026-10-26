import { useHold } from '@so/ui'
import {
    computed,
    type MaybeRefOrGetter,
    shallowRef,
    toValue,
    watch,
} from 'vue'

import { useCopyFeedback } from '#core'

import { GUARD_PERIOD_S, guardPhase, MASKED_CODE } from '../services/guardCode'
import { useGuardClock } from './useGuardClock'
import { useGuardCodes } from './useGuardCodes'

/** One account's Steam Guard control: masked until held, a countdown to the next code, copy. */
export function useGuardCode(accountId: MaybeRefOrGetter<string>) {
    const clock = useGuardClock()
    const codeAt = useGuardCodes()
    const { holding, handlers, stop } = useHold({ pans: true })
    const { copied, copy, reset } = useCopyFeedback()
    // A recycled list card hands this control to another account mid-hold.
    watch(
        () => toValue(accountId),
        () => {
            stop()
            reset()
        },
    )

    const phase = computed(() => guardPhase(clock.value))
    const shown = shallowRef(MASKED_CODE)
    // Opened only while held: masked cards never decrypt. A late code for another account or a released hold is dropped.
    watch(
        [holding, () => toValue(accountId), () => phase.value.period],
        async ([held, id], [, lastId], onCleanup) => {
            if (!held || id !== lastId) shown.value = MASKED_CODE
            if (!held) return
            let current = true
            onCleanup(() => {
                current = false
            })
            const code = await codeAt(id, clock.value)
            if (current) shown.value = code
        },
    )
    const currentCode = () => codeAt(toValue(accountId))

    return {
        holding,
        handlers,
        copied,
        shown,
        remaining: computed(() => phase.value.remaining / GUARD_PERIOD_S),
        currentCode,
        copyCode: () => copy(currentCode()),
    }
}
