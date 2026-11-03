import { describe, expect, it } from 'vitest'

import type { AccountsView } from '../model'

import {
    DEFAULT_CARD_FLAGS,
    DEFAULT_VIEW,
    parseCardFlags,
    parseView,
    serializeView,
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
    it('round-trips a view without its search', () => {
        const view: AccountsView = {
            query: '',
            field: 'note',
            bans: {
                vac: 'require',
                game: 'any',
                community: 'exclude',
                economy: 'any',
            },
            tags: ['t1', 't2'],
            tagMatch: 'all',
            sort: 'level',
            direction: 'asc',
        }
        expect(parseView(serializeView({ ...view, query: 'kyz' }))).toEqual(
            view,
        )
    })

    it('never stores or reads back the search', () => {
        expect(
            serializeView({ ...DEFAULT_VIEW, query: 'login1' }),
        ).not.toContain('login1')
        expect(parseView(JSON.stringify({ query: 'kyz' })).query).toBe('')
    })

    it('replaces a value outside its set with the default', () => {
        const parsed = parseView(
            JSON.stringify({
                field: 'password',
                sort: 'size',
                bans: { vac: 'maybe' },
                query: 5,
            }),
        )
        expect(parsed).toEqual(DEFAULT_VIEW)
    })
})
