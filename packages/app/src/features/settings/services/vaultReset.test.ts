import { describe, expect, it } from 'vitest'

import { canContinueReset } from './vaultReset'

describe('canContinueReset', () => {
    it('always lets the consequences step through', () => {
        expect(canContinueReset(1, '', 'Main vault')).toBe(true)
    })

    it('needs the exact vault name on step 2, ignoring outer spaces', () => {
        expect(canContinueReset(2, '', 'Main vault')).toBe(false)
        expect(canContinueReset(2, 'main vault', 'Main vault')).toBe(false)
        expect(canContinueReset(2, '  Main vault ', 'Main vault')).toBe(true)
    })

    it('has no Continue on the hold step', () => {
        expect(canContinueReset(3, 'Main vault', 'Main vault')).toBe(false)
    })
})
