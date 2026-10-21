import { describe, expect, it } from 'vitest'

import {
    DEFAULT_CARD_FLAGS,
    DEFAULT_VIEW,
    parseCardFlags,
    parseView,
} from './storedState'

describe('parseCardFlags', () => {
    it('reads stored booleans and defaults the rest', () => {
        expect(
            parseCardFlags(JSON.stringify({ tags: false, note: 'no' })),
        ).toEqual({
            ...DEFAULT_CARD_FLAGS,
            tags: false,
        })
    })

    it('survives nothing stored and broken text', () => {
        expect(parseCardFlags(null)).toEqual(DEFAULT_CARD_FLAGS)
        expect(parseCardFlags('{oops')).toEqual(DEFAULT_CARD_FLAGS)
    })
})

describe('parseView', () => {
    it('round-trips a stored view', () => {
        const view = {
            query: 'kyz',
            field: 'note',
            bans: {
                vac: 'require',
                game: 'any',
                community: 'exclude',
                economy: 'any',
            },
            sort: 'level',
            direction: 'asc',
        }
        expect(parseView(JSON.stringify(view))).toEqual(view)
    })

    it('replaces a value outside its set with the default', () => {
        const parsed = parseView(
            JSON.stringify({
                field: 'phone',
                sort: 'size',
                bans: { vac: 'maybe' },
                query: 5,
            }),
        )
        expect(parsed).toEqual(DEFAULT_VIEW)
    })
})
