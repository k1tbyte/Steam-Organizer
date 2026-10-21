import { describe, expect, it } from 'vitest'

import { demoGuardCode, GUARD_PERIOD_S, guardPhase } from './guardCode'

describe('demoGuardCode', () => {
    it('is stable within a period and five characters from the Steam alphabet', () => {
        const code = demoGuardCode('a1', 100)
        expect(code).toBe(demoGuardCode('a1', 100))
        expect(code).toMatch(/^[2-9B-DF-HJ-KM-NP-RT-WXY]{5}$/)
    })

    it('differs per account and per period', () => {
        expect(demoGuardCode('a1', 100)).not.toBe(demoGuardCode('a2', 100))
        expect(demoGuardCode('a1', 100)).not.toBe(demoGuardCode('a1', 101))
    })
})

describe('guardPhase', () => {
    it('counts the seconds left in the 30s window', () => {
        const start = GUARD_PERIOD_S * 1000 * 5
        expect(guardPhase(start)).toEqual({ period: 5, remaining: 30 })
        expect(guardPhase(start + 29_999)).toEqual({ period: 5, remaining: 1 })
        expect(guardPhase(start + 30_000)).toEqual({ period: 6, remaining: 30 })
    })
})
