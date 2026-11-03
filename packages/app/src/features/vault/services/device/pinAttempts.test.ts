import { describe, expect, it } from 'vitest'

import { isPinLocked, pinTriesLeft } from './pinAttempts'

describe('pinAttempts', () => {
    it('counts the tries left down to zero', () => {
        expect([0, 1, 2, 3, 4].map(pinTriesLeft)).toEqual([3, 2, 1, 0, 0])
    })

    it('locks the PIN on the third wrong try', () => {
        expect(isPinLocked(2)).toBe(false)
        expect(isPinLocked(3)).toBe(true)
    })
})
