import { describe, expect, it } from 'vitest'

import type { Account } from '../model'
import { buildRows } from './listRows'
import {
    applyOrder,
    cardsIn,
    dropIndex,
    groupGeometry,
    moveItems,
    withGroupOrder,
} from './reorder'

const account = (id: string) => ({ id }) as Account
const some = (prefix: string, n: number) =>
    Array.from({ length: n }, (_, i) => account(`${prefix}${i}`))

describe('moveItems', () => {
    it('moves one forward and back', () => {
        expect(moveItems(['a', 'b', 'c', 'd'], [0], 2)).toEqual([
            'b',
            'c',
            'a',
            'd',
        ])
        expect(moveItems(['a', 'b', 'c', 'd'], [3], 1)).toEqual([
            'a',
            'd',
            'b',
            'c',
        ])
        expect(moveItems(['a', 'b'], [1], 1)).toEqual(['a', 'b'])
    })

    it('gathers scattered items at `to` in their order', () => {
        expect(moveItems(['a', 'b', 'c', 'd', 'e'], [4, 1], 0)).toEqual([
            'b',
            'e',
            'a',
            'c',
            'd',
        ])
        expect(moveItems(['a', 'b', 'c', 'd', 'e'], [0, 2], 3)).toEqual([
            'b',
            'd',
            'e',
            'a',
            'c',
        ])
    })
})

describe('withGroupOrder', () => {
    it('permutes the group in its own places and leaves the other group', () => {
        // p* pinned, r* the rest, interleaved in the vault.
        expect(
            withGroupOrder(['p0', 'r0', 'p1', 'r1', 'p2'], ['p2', 'p0', 'p1']),
        ).toEqual(['p2', 'r0', 'p0', 'r1', 'p1'])
    })
})

describe('applyOrder', () => {
    it('follows the order and keeps unknown ids after it in their own order', () => {
        const ids = applyOrder(some('a', 4), ['a2', 'a0']).map((a) => a.id)
        expect(ids).toEqual(['a2', 'a0', 'a1', 'a3'])
    })
})

describe('dropIndex', () => {
    const sizes = { unit: 4, gapUnits: 3, cardPx: 100 }
    const rows = buildRows(some('p', 2), some('r', 7), 3)
    // Cells 200px wide with a 12px gap; card rows 112px high.
    const all = groupGeometry(rows, 'all', sizes, {
        columns: 3,
        cellWidth: 200,
        count: 7,
    })

    it('starts a group under its heading and the groups above', () => {
        const pinned = groupGeometry(rows, 'pinned', sizes, {
            columns: 3,
            cellWidth: 200,
            count: 2,
        })
        expect(pinned.top).toBe(28)
        // Pinned heading, one card row, the spaced heading.
        expect(all.top).toBe(28 + 112 + 36)
    })

    it('maps a point to row and column', () => {
        expect(dropIndex({ x: 10, y: all.top + 10 }, all)).toBe(0)
        expect(dropIndex({ x: 420, y: all.top + 112 + 50 }, all)).toBe(5)
    })

    it('finds nothing off the group: above, beside, past its last card', () => {
        expect(dropIndex({ x: 420, y: all.top - 300 }, all)).toBeNull()
        expect(dropIndex({ x: -50, y: all.top + 10 }, all)).toBeNull()
        expect(dropIndex({ x: 5000, y: all.top + 10 }, all)).toBeNull()
        // The last row holds one card; its empty tail and the space below hold none.
        expect(dropIndex({ x: 10, y: all.top + 112 * 2 + 10 }, all)).toBe(6)
        expect(dropIndex({ x: 420, y: all.top + 112 * 2 + 10 }, all)).toBeNull()
        expect(dropIndex({ x: 10, y: all.top + 112 * 5 }, all)).toBeNull()
    })
})

describe('cardsIn', () => {
    const sizes = { unit: 4, gapUnits: 3, cardPx: 100 }
    const rows = buildRows(some('p', 2), some('r', 7), 3)
    // Cells 200px wide with a 12px gap; card rows 112px high, cards 100px.
    const all = groupGeometry(rows, 'all', sizes, {
        columns: 3,
        cellWidth: 200,
        count: 7,
    })
    const box = (left: number, top: number, right: number, bottom: number) => ({
        left,
        top: all.top + top,
        right,
        bottom: all.top + bottom,
    })

    it('takes every card the rectangle overlaps', () => {
        expect(cardsIn(box(190, 90, 220, 120), all)).toEqual([0, 1, 3, 4])
        expect(cardsIn(box(0, 0, 1000, 1000), all)).toEqual([
            0, 1, 2, 3, 4, 5, 6,
        ])
    })

    it('takes none from a gap, above the group or past its last card', () => {
        expect(cardsIn(box(202, 10, 210, 50), all)).toEqual([])
        expect(cardsIn(box(0, 102, 600, 110), all)).toEqual([])
        expect(cardsIn(box(0, -60, 600, -10), all)).toEqual([])
        expect(cardsIn(box(220, 230, 600, 300), all)).toEqual([])
    })
})
