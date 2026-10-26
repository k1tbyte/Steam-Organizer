import { describe, expect, it } from 'vitest'

import { FIELD_DEFAULTS, RECORD } from './records'
import { placeFields, readSettings } from './settings'

describe('readSettings', () => {
    it('reads a missing record or field as the defaults', () => {
        expect(readSettings(undefined).fieldDefaults).toEqual(FIELD_DEFAULTS)
        const stored = readSettings({
            kind: RECORD.SETTINGS,
            fieldDefaults: { note: 'secret', login: 'bogus' },
            moving: true,
        })
        expect(stored.fieldDefaults).toEqual({
            ...FIELD_DEFAULTS,
            note: 'secret',
        })
        expect(stored.moving).toBe(true)
    })
})

describe('placeFields', () => {
    const placement = {
        ...FIELD_DEFAULTS,
        login: 'secret',
        email: 'searchable',
    } as const

    it('moves each field to its part and leaves the rest', () => {
        const { data, secret, moved } = placeFields(
            { login: 'alpha', note: 'n', alias: 'A' },
            { email: 'a@b.c', password: 'p' },
            placement,
        )
        expect(moved).toBe(true)
        expect(data).toEqual({ note: 'n', alias: 'A', email: 'a@b.c' })
        expect(secret).toEqual({ login: 'alpha', password: 'p' })
    })

    it('reports nothing moved when every field fits, and keeps the placed copy over a stray one', () => {
        expect(
            placeFields({ note: 'n' }, { login: 'a' }, placement).moved,
        ).toBe(false)
        const both = placeFields(
            { login: 'stale' },
            { login: 'kept' },
            placement,
        )
        expect(both.secret.login).toBe('kept')
        expect(both.data.login).toBeUndefined()
    })
})
