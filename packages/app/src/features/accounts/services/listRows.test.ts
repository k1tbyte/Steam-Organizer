import { describe, expect, it } from 'vitest'

import type { Account } from '../model'
import { buildRows, columnsFor, rowHeight } from './listRows'

const account = (id: string) => ({ id }) as Account
const some = (prefix: string, n: number) =>
    Array.from({ length: n }, (_, i) => account(`${prefix}${i}`))

describe('columnsFor', () => {
    it('fits cards of at least 340px with the gap between', () => {
        expect(columnsFor(358, 12)).toBe(1)
        expect(columnsFor(691, 12)).toBe(1)
        expect(columnsFor(692, 12)).toBe(2)
        expect(columnsFor(1043, 12)).toBe(2)
        expect(columnsFor(1044, 12)).toBe(3)
    })

    it('never drops below one column', () => {
        expect(columnsFor(0, 12)).toBe(1)
    })
})

describe('buildRows', () => {
    it('lists a heading and rows per non-empty group', () => {
        const rows = buildRows(some('p', 2), some('r', 5), 3)
        expect(
            rows.map((r) => (r.kind === 'heading' ? r.key : r.accounts.length)),
        ).toEqual(['pinned', 2, 'all', 3, 2])
    })

    it('spaces the second heading only after a pinned group', () => {
        const [, , heading] = buildRows(some('p', 1), some('r', 1), 2)
        expect(heading).toMatchObject({ key: 'all', spaced: true })
        const [first] = buildRows([], some('r', 1), 2)
        expect(first).toMatchObject({ key: 'all', spaced: false })
    })

    it('is empty with nothing to show', () => {
        expect(buildRows([], [], 3)).toEqual([])
    })
})

describe('rowHeight', () => {
    const sizes = { unit: 4, gapUnits: 3, cardPx: 141 }

    it('adds the gap below a card row and below a heading', () => {
        const [heading, cards] = buildRows(some('p', 1), [], 1)
        expect(rowHeight(cards as never, sizes)).toBe(141 + 12)
        expect(rowHeight(heading as never, sizes)).toBe(16 + 12)
    })

    it('adds room above a spaced heading', () => {
        const spaced = { kind: 'heading', key: 'all', spaced: true } as const
        expect(rowHeight(spaced, sizes)).toBe(16 + 12 + 8)
    })
})
