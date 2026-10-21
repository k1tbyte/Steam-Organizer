import { useTimer } from '@so/ui/useTimer'
import { shallowRef } from 'vue'

const FILLED_MS = 1500

/** The "Filled" state a fill button holds for a moment after it ran. */
export function useFillFeedback() {
    const filled = shallowRef(false)
    const timer = useTimer()

    function markFilled() {
        filled.value = true
        timer.arm(FILLED_MS, () => {
            filled.value = false
        })
    }

    return { filled, markFilled }
}
