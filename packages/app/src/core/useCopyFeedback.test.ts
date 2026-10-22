import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'

import { useCopyFeedback } from './useCopyFeedback'

function deferClipboard() {
    let resolve = () => {}
    vi.stubGlobal('navigator', {
        clipboard: {
            writeText: () => new Promise<void>((done) => (resolve = done)),
        },
    })
    return () => resolve()
}

function inScope() {
    const scope = effectScope()
    const feedback = scope.run(useCopyFeedback)
    if (!feedback) throw new Error('scope stopped')
    return { scope, feedback }
}

describe('useCopyFeedback', () => {
    afterEach(() => vi.unstubAllGlobals())

    it('marks a copy once the clipboard has it', async () => {
        const finish = deferClipboard()
        const { scope, feedback } = inScope()
        const copying = feedback.copy('a')
        expect(feedback.copied.value).toBe(false)
        finish()
        await copying
        expect(feedback.copied.value).toBe(true)
        scope.stop()
    })

    it('drops a copy still pending when reset runs', async () => {
        const finish = deferClipboard()
        const { scope, feedback } = inScope()
        const copying = feedback.copy('a')
        feedback.reset()
        finish()
        await copying
        expect(feedback.copied.value).toBe(false)
        scope.stop()
    })
})
