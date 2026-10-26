import { FIELD_DEFAULTS } from '@so/core'
import { describe, expect, it } from 'vitest'

import { placementMoves, placementOf, secretCount } from './fieldSecrecy'

const placement = { ...FIELD_DEFAULTS, login: 'secret' } as const

describe('placementOf', () => {
    it('follows the vault for movable fields and ignores it for fixed ones', () => {
        expect(placementOf('login', placement)).toBe('secret')
        expect(placementOf('nickname', { ...placement })).toBe('searchable')
        expect(placementOf('password', placement)).toBe('secret')
    })
})

it('counts placed and fixed secrets together', () => {
    expect(
        secretCount(['nickname', 'login', 'password', 'auth'], placement),
    ).toBe(3)
})

it('splits the moved fields by where they go', () => {
    expect(
        placementMoves(FIELD_DEFAULTS, { ...placement, email: 'searchable' }),
    ).toEqual({
        moved: ['login', 'email'],
        toSecret: ['login'],
        toSearchable: ['email'],
    })
})
