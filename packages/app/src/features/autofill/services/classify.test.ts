import { describe, expect, it } from 'vitest'

import { classifyPage, type FieldInfo } from './classify'

function field(overrides: Partial<FieldInfo> = {}): FieldInfo {
    return {
        type: 'text',
        name: '',
        id: '',
        autocomplete: '',
        placeholder: '',
        ariaLabel: '',
        maxLength: -1,
        visible: true,
        ...overrides,
    }
}

const box = () => field({ maxLength: 1 })

describe('classifyPage: login', () => {
    it('finds Steam sign-in inputs that carry no names', () => {
        const fields = [field(), field({ type: 'password' })]
        expect(classifyPage(fields)).toEqual({
            kind: 'login',
            login: 0,
            password: 1,
        })
    })

    it('finds the community and help forms by their ids', () => {
        const fields = [
            field({ id: 'search', placeholder: 'Search' }),
            field({ id: 'steamAccountName' }),
            field({ type: 'password', id: 'steamPassword' }),
        ]
        expect(classifyPage(fields)).toEqual({
            kind: 'login',
            login: 1,
            password: 2,
        })
    })

    it('takes the closest text field when none has a hint', () => {
        const fields = [field(), field(), field({ type: 'password' })]
        expect(classifyPage(fields)).toMatchObject({ login: 1, password: 2 })
    })

    it('takes an email field before the password', () => {
        const fields = [field({ type: 'email' }), field({ type: 'password' })]
        expect(classifyPage(fields)).toMatchObject({ login: 0, password: 1 })
    })

    it('ignores hidden fields', () => {
        const fields = [
            field({ visible: false }),
            field({ type: 'password', visible: false }),
        ]
        expect(classifyPage(fields)).toBeNull()
    })

    it('is not a login form without a text field before the password', () => {
        expect(classifyPage([field({ type: 'password' })])).toBeNull()
        expect(classifyPage([field({ type: 'password' }), field()])).toBeNull()
    })

    it('is not a login form without a password', () => {
        expect(classifyPage([field({ type: 'search' }), field()])).toBeNull()
        expect(classifyPage([])).toBeNull()
    })
})

describe('classifyPage: Steam Guard', () => {
    it('finds a code split across single-character boxes', () => {
        const fields = [field(), box(), box(), box(), box(), box()]
        expect(classifyPage(fields)).toEqual({
            kind: 'guard',
            code: [1, 2, 3, 4, 5],
        })
    })

    it('does not take a couple of one-character fields for a code', () => {
        expect(classifyPage([box(), box()])).toBeNull()
    })

    it('finds the first run when boxes are interrupted', () => {
        const fields = [box(), box(), field(), box(), box(), box(), box()]
        expect(classifyPage(fields)).toEqual({
            kind: 'guard',
            code: [3, 4, 5, 6],
        })
    })

    it('finds the single code input of the community login', () => {
        const fields = [field({ id: 'twofactorcode_entry', maxLength: 5 })]
        expect(classifyPage(fields)).toEqual({ kind: 'guard', code: [0] })
    })

    it('finds a one-time-code input without a length', () => {
        const fields = [field({ autocomplete: 'one-time-code' })]
        expect(classifyPage(fields)).toEqual({ kind: 'guard', code: [0] })
    })

    it('does not take a short hinted input for a code', () => {
        expect(classifyPage([field({ id: 'otp', maxLength: 2 })])).toBeNull()
    })

    it('wins over a login form still on the page', () => {
        const fields = [
            field({ id: 'steamAccountName' }),
            field({ type: 'password' }),
            field({ id: 'twofactorcode_entry', maxLength: 5 }),
        ]
        expect(classifyPage(fields)).toEqual({ kind: 'guard', code: [2] })
    })

    it('ignores hidden code boxes', () => {
        const hidden = () => field({ maxLength: 1, visible: false })
        expect(
            classifyPage([hidden(), hidden(), hidden(), hidden()]),
        ).toBeNull()
    })
})
