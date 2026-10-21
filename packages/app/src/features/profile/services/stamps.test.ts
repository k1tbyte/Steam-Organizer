import { describe, expect, it } from 'vitest'

import { stampParts } from './stamps'

const at = (day: number, hour: number, minute: number) =>
    new Date(2025, 10, day, hour, minute).getTime()
const now = at(20, 15, 0)

describe('stampParts', () => {
    it('names today and yesterday', () => {
        const today = stampParts(at(20, 13, 50), now, 'en')
        expect(today.date).toBe('Today')
        expect(today.time).toContain('1:50')
        expect(stampParts(at(19, 22, 40), now, 'en').date).toBe('Yesterday')
    })

    it('writes a calendar date from the day before yesterday on', () => {
        const stamp = stampParts(at(11, 17, 58), now, 'en')
        expect(stamp.date).toBe('Nov 11, 2025')
        expect(stamp.time).toContain('5:58')
    })

    it('counts calendar days, not 24-hour spans', () => {
        expect(stampParts(at(19, 23, 59), at(20, 0, 5), 'en').date).toBe(
            'Yesterday',
        )
    })
})
