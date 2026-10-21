import { useTimer } from '@so/ui/useTimer'
import { shallowRef } from 'vue'

import { reportError } from './reportError'

const FEEDBACK_MS = 1200

/** Copies text and holds `copied` briefly, for a value that swaps to "Copied" in place. */
export function useCopyFeedback() {
    const copied = shallowRef(false)
    const timer = useTimer()

    async function copy(text: string) {
        try {
            await navigator.clipboard.writeText(text)
        } catch (error) {
            reportError(error, 'clipboard')
            return
        }
        copied.value = true
        timer.arm(FEEDBACK_MS, () => {
            copied.value = false
        })
    }

    return { copied, copy }
}
