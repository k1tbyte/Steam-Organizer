import { describe, expect, it } from 'vitest'

import { validateNewAccount } from './newAccount'

const existing = { logins: ['kyzzdef'], steamIds: ['1084529371'] }
const valid = { login: 'nova_strike', password: 'hunter22!', steamId: '' }

describe('validateNewAccount', () => {
    it('accepts a login and a password of six characters', () => {
        expect(validateNewAccount(valid, existing)).toEqual({
            errors: { login: null, password: null, steamId: null },
            canAdd: true,
        })
        expect(
            validateNewAccount({ ...valid, password: '123456' }, existing)
                .canAdd,
        ).toBe(true)
    })

    it('needs a login and a password before adding, without flagging empty fields', () => {
        const empty = validateNewAccount(
            { login: '', password: '', steamId: '' },
            existing,
        )
        expect(empty.errors).toEqual({
            login: null,
            password: null,
            steamId: null,
        })
        expect(empty.canAdd).toBe(false)
    })

    it('flags a short password and a login already in the vault, ignoring case', () => {
        const { errors, canAdd } = validateNewAccount(
            { login: ' KyzzDef ', password: '12345', steamId: '' },
            existing,
        )
        expect(errors).toMatchObject({ login: 'taken', password: 'short' })
        expect(canAdd).toBe(false)
    })

    it('flags an unrecognized or an already stored Steam ID', () => {
        expect(
            validateNewAccount({ ...valid, steamId: 'no good!' }, existing)
                .errors.steamId,
        ).toBe('unrecognized')
        const taken = validateNewAccount(
            { ...valid, steamId: '76561199044795099' },
            existing,
        )
        expect(taken.errors.steamId).toBe('taken')
        expect(taken.canAdd).toBe(false)
    })

    it('treats the Steam ID as optional', () => {
        expect(
            validateNewAccount(
                { ...valid, steamId: '76561198012345678' },
                existing,
            ).canAdd,
        ).toBe(true)
    })
})
