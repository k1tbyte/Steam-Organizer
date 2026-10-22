import { describe, expect, it } from 'vitest'

import type { Account } from '../model'
import { buildRows } from './listRows'
import {
    applyOrder,
    dropIndex,
    groupGeometry,
    moveItem,
    withGroupOrder,
} from './reorder'

const account = (id: string) => ({ id }) as Account
const some = (prefix: string, n: number) =>
    Array.from({ length: n }, (_, i) => account(`${prefix}${i}`))

describe('moveItem', () => {
    it('moves forward and back', () => {
        expect(moveItem(['a', 'b', 'c', 'd'], 0, 2)).toEqual([
            'b',
            'c',
            'a',
            'd',
        ])
        expect(moveItem(['a', 'b', 'c', 'd'], 3, 1)).toEqual([
            'a',
            'd',
            'b',
            'c',
        ])
        expect(moveItem(['a', 'b'], 1, 1)).toEqual(['a', 'b'])
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
