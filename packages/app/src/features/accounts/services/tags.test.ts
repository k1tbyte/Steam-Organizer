import { describe, expect, it } from 'vitest'

import {
    findTag,
    freeHue,
    nextTagState,
    stateOf,
    TAG_HUES,
    type TagState,
    tagChanges,
    tagCounts,
    tagLabel,
} from './tags'

const main = { id: 'm', label: 'main', hue: 265 }
const trade = { id: 't', label: 'Trade', hue: 150 }

describe('tags', () => {
    it('trims a label and finds a tag ignoring case', () => {
        expect(tagLabel('  cs2   prime ')).toBe('cs2 prime')
        expect(findTag([main, trade], ' TRADE')).toBe(trade)
        expect(findTag([main, trade], 'farm')).toBeUndefined()
    })

    it('gives a new tag the first swatch no tag wears', () => {
        expect(freeHue([main, trade])).toBe(TAG_HUES[1])
        const all = TAG_HUES.map((hue, i) => ({
            id: `${i}`,
            label: `${i}`,
            hue,
        }))
        expect(TAG_HUES).toContain(freeHue(all))
    })

    it('counts tags over the picked accounts', () => {
        const counts = tagCounts([{ tags: [main, trade] }, { tags: [main] }])
        expect(counts).toEqual(
            new Map([
                ['m', 2],
                ['t', 1],
            ]),
        )
        expect([stateOf(2, 2), stateOf(1, 2), stateOf(0, 2)]).toEqual([
            'all',
            'some',
            'none',
        ])
    })

    it('cycles a mixed tag through all and none back to mixed, and flips the others', () => {
        const walk = (initial: TagState) => {
            const seen = [initial]
            for (let i = 0; i < 3; i++)
                seen.push(nextTagState(initial, seen.at(-1) as TagState))
            return seen
        }
        expect(walk('some')).toEqual(['some', 'all', 'none', 'some'])
        expect(walk('all')).toEqual(['all', 'none', 'all', 'none'])
        expect(walk('none')).toEqual(['none', 'all', 'none', 'all'])
    })

    it('turns changed states into ids to add and remove', () => {
        const initial = new Map<string, TagState>([
            ['m', 'all'],
            ['t', 'some'],
            ['f', 'none'],
        ])
        const current = new Map<string, TagState>([
            ['m', 'none'],
            ['t', 'some'],
            ['f', 'all'],
            ['new', 'all'],
        ])
        expect(tagChanges(initial, current)).toEqual({
            add: ['f', 'new'],
            remove: ['m'],
        })
        expect(tagChanges(initial, initial)).toEqual({ add: [], remove: [] })
    })
})
