import { describe, expect, it } from 'vitest'

import { flag, oneOf, parseRecord } from './storage'

describe('parseRecord', () => {
    it('reads a JSON object', () => {
        expect(parseRecord('{"a":1,"b":{"c":true}}')).toEqual({
            a: 1,
            b: { c: true },
        })
    })

    it('gives an empty record for nothing, malformed text or a non-object', () => {
        for (const raw of [
            null,
            undefined,
            '',
            '{oops',
            'null',
            '7',
            '"x"',
            '[1]',
        ])
            expect(parseRecord(raw)).toEqual({})
    })
})

describe('oneOf', () => {
    const sizes = ['s', 'm', 'l'] as const

    it('keeps an allowed value', () => {
        expect(oneOf(sizes, 'm', 'l')).toBe('m')
    })

    it('falls back for anything else', () => {
        expect(oneOf(sizes, 'xl', 's')).toBe('s')
        expect(oneOf(sizes, 1, 's')).toBe('s')
        expect(oneOf(sizes, undefined, 'l')).toBe('l')
    })
})

describe('flag', () => {
    it('keeps a boolean, true or false', () => {
        expect(flag(false, true)).toBe(false)
        expect(flag(true, false)).toBe(true)
    })

    it('falls back for anything that is not a boolean', () => {
        expect(flag('yes', true)).toBe(true)
        expect(flag(0, true)).toBe(true)
        expect(flag(undefined, false)).toBe(false)
    })
})
