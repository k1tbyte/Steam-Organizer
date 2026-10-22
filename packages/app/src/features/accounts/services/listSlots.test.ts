import { describe, expect, it } from 'vitest'

import { assignSlots } from './listSlots'

const slotsOf = (map: Map<string, number>) => Object.fromEntries(map)

describe('assignSlots', () => {
    it('numbers the first range from 0', () => {
        expect(slotsOf(assignSlots(new Map(), ['a', 'b', 'c']))).toEqual({
            a: 0,
            b: 1,
            c: 2,
        })
    })

    it('keeps rows that stay and hands a leaving row slot to the one that came in', () => {
        const first = assignSlots(new Map(), ['r0', 'r1', 'r2', 'r3'])
        expect(slotsOf(assignSlots(first, ['r1', 'r2', 'r3', 'r4']))).toEqual({
            r1: 1,
            r2: 2,
            r3: 3,
            r4: 0,
        })
    })

    it('reuses freed slots lowest first and only grows past them when the range grows', () => {
        const first = assignSlots(new Map(), ['r0', 'r1', 'r2'])
        const jumped = assignSlots(first, ['r9', 'r10', 'r11', 'r12'])
        expect(slotsOf(jumped)).toEqual({ r9: 0, r10: 1, r11: 2, r12: 3 })
    })

    it('never gives two rows one slot', () => {
        let slots = new Map<string, number>()
        for (let start = 0; start < 40; start += 3) {
            const size = 4 + (start % 5)
            const keys = Array.from({ length: size }, (_, i) => `r${start + i}`)
            slots = assignSlots(slots, keys)
            expect(new Set(slots.values()).size).toBe(keys.length)
            expect(Math.max(...slots.values())).toBeLessThan(9)
        }
    })
})
