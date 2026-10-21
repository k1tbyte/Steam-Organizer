import { describe, expect, it } from 'vitest'

import { passwordStrength } from './passwordStrength'

describe('passwordStrength', () => {
    it('scores nothing for empty and very short input', () => {
        expect(passwordStrength('')).toBe(0)
        expect(passwordStrength('abc')).toBe(0)
    })

    it('ignores composition below the minimum length', () => {
        expect(passwordStrength('Aa1!')).toBe(0)
        expect(passwordStrength('Aa1!xy')).toBe(1)
    })

    it('calls six or seven characters weak', () => {
        expect(passwordStrength('abcdef')).toBe(1)
        expect(passwordStrength('abcdefg')).toBe(1)
    })

    it('adds a point for length, case mix, and digit with symbol', () => {
        expect(passwordStrength('abcdefgh')).toBe(1)
        expect(passwordStrength('abcdefghijkl')).toBe(2)
        expect(passwordStrength('abcdEFGH')).toBe(2)
        expect(passwordStrength('abcdEFGHijkl')).toBe(3)
        expect(passwordStrength('abcdEFGHijk1!')).toBe(4)
    })

    it('needs both a digit and a symbol for the last point', () => {
        expect(passwordStrength('abcdefg1')).toBe(1)
        expect(passwordStrength('abcdefg!')).toBe(1)
        expect(passwordStrength('abcdefg1!')).toBe(2)
    })
})
