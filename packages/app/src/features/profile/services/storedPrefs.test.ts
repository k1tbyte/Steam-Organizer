import { describe, expect, it } from 'vitest'

import {
    DEFAULT_ID_FORMAT,
    NO_COLLAPSED_SECTIONS,
    parseCollapsedSections,
    parseIdFormat,
} from './storedPrefs'

describe('parseIdFormat', () => {
    it('keeps a known format', () => {
        expect(parseIdFormat('steam2')).toBe('steam2')
    })

    it('falls back for nothing stored or an unknown format', () => {
        expect(parseIdFormat(null)).toBe(DEFAULT_ID_FORMAT)
        expect(parseIdFormat('profile-url')).toBe(DEFAULT_ID_FORMAT)
    })
})

describe('parseCollapsedSections', () => {
    it('reads the collapsed ones and opens the rest', () => {
        expect(parseCollapsedSections('{"bans":true,"note":false}')).toEqual({
            ...NO_COLLAPSED_SECTIONS,
            bans: true,
        })
    })

    it('opens everything for a missing or malformed entry', () => {
        expect(parseCollapsedSections(null)).toEqual(NO_COLLAPSED_SECTIONS)
        expect(parseCollapsedSections('{oops')).toEqual(NO_COLLAPSED_SECTIONS)
        expect(parseCollapsedSections('7')).toEqual(NO_COLLAPSED_SECTIONS)
    })
})
