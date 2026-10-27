import { describe, expect, it } from 'vitest'

import { checkLockForm } from './accountLock'

describe('checkLockForm', () => {
    it('waits for the repeat before judging', () => {
        expect(checkLockForm('1234', '')).toEqual({
            matches: false,
            mismatch: false,
            canLock: false,
        })
    })

    it('flags a repeat that differs', () => {
        expect(checkLockForm('1234', '123')).toMatchObject({
            mismatch: true,
            canLock: false,
        })
    })

    it('locks on a matching, non-empty pair', () => {
        expect(checkLockForm('1234', '1234')).toEqual({
            matches: true,
            mismatch: false,
            canLock: true,
        })
    })
})
