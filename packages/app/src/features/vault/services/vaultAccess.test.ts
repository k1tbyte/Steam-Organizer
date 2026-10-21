import { describe, expect, it } from 'vitest'

import { redirectFor } from './vaultAccess'

describe('redirectFor', () => {
    it('keeps app pages for an unlocked session only', () => {
        expect(redirectFor('unlocked')).toBeUndefined()
        expect(redirectFor('locked')).toBe('/unlock')
        expect(redirectFor('new')).toBe('/welcome')
    })

    it('sends a session to its own home from a page it may not open', () => {
        expect(redirectFor('unlocked', ['new'])).toBe('/')
        expect(redirectFor('new', ['locked'])).toBe('/welcome')
    })

    it('lets a session stay on a page that allows its state', () => {
        expect(redirectFor('locked', ['locked'])).toBeUndefined()
        expect(redirectFor('new', ['new'])).toBeUndefined()
    })
})
