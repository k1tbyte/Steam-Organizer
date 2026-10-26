import { useTimer } from '@so/ui/useTimer'
import { shallowRef } from 'vue'

import { reportError } from './reportError'

const FEEDBACK_MS = 1200

/** Writes to the clipboard; a refusal is reported, not thrown. A promised text (a secret still opening) goes in
 *  as a pending item: Safari takes it only within the press, which an await before the write would outlast. */
export async function copyText(
    text: string | Promise<string>,
): Promise<boolean> {
    try {
        if (typeof text === 'string') await navigator.clipboard.writeText(text)
        else {
            const blob = text.then(
                (value) => new Blob([value], { type: 'text/plain' }),
            )
            await navigator.clipboard.write([
                new ClipboardItem({ 'text/plain': blob }),
            ])
        }
        return true
    } catch (error) {
        reportError(error, 'clipboard')
        return false
    }
}

/** Copies text and holds `copied` briefly, for a value that swaps to "Copied" in place. */
export function useCopyFeedback() {
    const copied = shallowRef(false)
    const timer = useTimer()
    // A copy still awaiting the clipboard when `reset` runs must not mark what the caller shows now.
    let generation = 0

    async function copy(text: string | Promise<string>) {
        const own = ++generation
        if (!(await copyText(text)) || own !== generation) return
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
