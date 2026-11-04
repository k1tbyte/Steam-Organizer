import { describe, expect, it } from 'vitest'

import {
    canChangePassword,
    passwordStrength,
    repeatState,
} from './passwordStrength'

describe('passwordStrength', () => {
    it('rates nothing for empty and very short input', () => {
        expect(passwordStrength('')).toBe(0)
        expect(passwordStrength('abc')).toBe(0)
    })

    it('rates six and seven characters as weak whatever they contain', () => {
        expect(passwordStrength('abcdef')).toBe(1)
        expect(passwordStrength('abcdefg')).toBe(1)
        expect(passwordStrength('Aa1!aa')).toBe(1)
        expect(passwordStrength('Aa1!')).toBe(0)
    })

    it('adds a level for length, mixed case and digits with symbols', () => {
        expect(passwordStrength('abcdefgh')).toBe(1)
        expect(passwordStrength('abcdefghijkl')).toBe(2)
        expect(passwordStrength('abcdefGHIJKL')).toBe(3)
        expect(passwordStrength('abcdefGHIJ12!')).toBe(4)
    })

    it('needs a digit and a symbol together', () => {
        expect(passwordStrength('abcdefgh12')).toBe(1)
        expect(passwordStrength('abcdefgh!!')).toBe(1)
        expect(passwordStrength('abcdefgh12!')).toBe(2)
    })
})

describe('repeatState', () => {
    it('stays quiet until something is typed', () => {
        expect(repeatState('secret123', '')).toBe('empty')
    })

    it('compares exactly', () => {
        expect(repeatState('secret123', 'secret123')).toBe('match')
        expect(repeatState('secret123', 'Secret123')).toBe('mismatch')
    })
})

describe('canChangePassword', () => {
    const valid = { current: 'demo', next: 'secret123', repeat: 'secret123' }

    it('accepts a filled current, a long enough new one and a matching repeat', () => {
        expect(canChangePassword(valid)).toBe(true)
    })

    it('rejects each missing piece', () => {
        expect(canChangePassword({ ...valid, current: '' })).toBe(false)
        expect(
            canChangePassword({ ...valid, next: 'short', repeat: 'short' }),
        ).toBe(false)
        expect(canChangePassword({ ...valid, repeat: 'other' })).toBe(false)
    })
})
