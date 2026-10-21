import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'

import { useGuardClock } from './useGuardClock'

describe('useGuardClock', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('shares one interval between readers and stops with the last one', () => {
        const first = effectScope()
        const second = effectScope()
        const clock = first.run(useGuardClock)
        second.run(useGuardClock)
        expect(vi.getTimerCount()).toBe(1)

        const before = clock?.value ?? 0
        vi.advanceTimersByTime(1000)
        expect(clock?.value).toBeGreaterThan(before)

        first.stop()
        expect(vi.getTimerCount()).toBe(1)
        second.stop()
        expect(vi.getTimerCount()).toBe(0)
    })
})
