import { describe, expect, it } from 'vitest'

import { ageTier, initialsOf, levelHue, levelTier } from './tiers'

describe('levelTier', () => {
    it('takes the tens digit and wraps every hundred', () => {
        expect(levelTier(0)).toBe(0)
        expect(levelTier(9)).toBe(0)
        expect(levelTier(27)).toBe(2)
        expect(levelTier(71)).toBe(7)
        expect(levelTier(105)).toBe(0)
    })
})

describe('levelHue', () => {
    it('follows the tier and repeats with the wrap', () => {
        expect(levelHue(5)).toBe(0)
        expect(levelHue(27)).toBe(55)
        expect(levelHue(127)).toBe(55)
    })
})

describe('ageTier', () => {
    it('steps at 5, 10 and 15 years', () => {
        expect(ageTier(4.9, false)).toBe(0)
        expect(ageTier(5, false)).toBe(1)
        expect(ageTier(9.9, false)).toBe(1)
        expect(ageTier(10, false)).toBe(2)
        expect(ageTier(22, false)).toBe(3)
    })

    it('leaves an anonymous account in the first tier', () => {
        expect(ageTier(22, true)).toBe(0)
    })
})

describe('initialsOf', () => {
    it('uses the first letter of up to two words', () => {
        expect(initialsOf('kyzzdef')).toBe('K')
        expect(initialsOf('Halcyon_North')).toBe('HN')
        expect(initialsOf('bunny hop')).toBe('BH')
        expect(initialsOf('Borealis Fyne Third')).toBe('BF')
    })
})
