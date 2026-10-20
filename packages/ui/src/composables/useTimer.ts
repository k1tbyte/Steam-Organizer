import { onScopeDispose } from 'vue'

/** setTimeout owned by the calling scope: re-arming and teardown both cancel. Subpath export, so the app skips the SFC barrel. */
export function useTimer() {
    let id: ReturnType<typeof setTimeout> | undefined

    function cancel() {
        clearTimeout(id)
        id = undefined
    }

    /** Replaces whatever was pending, so arming twice never leaves two running. */
    function arm(delayMs: number, run: () => void) {
        cancel()
        id = setTimeout(run, delayMs)
    }

    onScopeDispose(cancel)

    return { arm, cancel }
}
