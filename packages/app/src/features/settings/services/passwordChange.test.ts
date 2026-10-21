import { describe, expect, it } from 'vitest'

import { canChangePassword, repeatState } from './passwordChange'

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
