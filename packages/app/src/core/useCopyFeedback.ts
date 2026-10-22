import { useTimer } from '@so/ui/useTimer'
import { shallowRef } from 'vue'

import { reportError } from './reportError'

const FEEDBACK_MS = 1200

/** Copies text and holds `copied` briefly, for a value that swaps to "Copied" in place. */
export function useCopyFeedback() {
    const copied = shallowRef(false)
    const timer = useTimer()
    // A copy still awaiting the clipboard when `reset` runs must not mark what the caller shows now.
    let generation = 0

    async function copy(text: string) {
        const own = ++generation
        try {
            await navigator.clipboard.writeText(text)
        } catch (error) {
            reportError(error, 'clipboard')
            return
        }
        if (own !== generation) return
        copied.value = true
        timer.arm(FEEDBACK_MS, () => {
            copied.value = false
        })
    }

    function reset() {
        generation++
        timer.cancel()
        copied.value = false
    }

    return { copied, copy, reset }
}
