import { computed } from 'vue'

import { GUARD_PERIOD_S, guardPhase } from '../services/guardCode'
import { useGuardClock } from './useGuardClock'

/** The share of the current code's 30 s window left, on the shared one-second clock; opens no secret. */
export function useGuardCountdown() {
    const clock = useGuardClock()
    return {
        remaining: computed(
            () => guardPhase(clock.value).remaining / GUARD_PERIOD_S,
        ),
    }
}
