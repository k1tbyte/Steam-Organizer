import { expect, it } from 'vitest'

import { parseTabRequest, readFilled, readTabContext } from './tabMessages'

it('takes a known tab request with the fields it needs', () => {
    expect(parseTabRequest({ type: 'tab:context' })).toEqual({
        type: 'tab:context',
    })
    expect(
        parseTabRequest({
            type: 'tab:fill-login',
            id: 'a',
            login: 'l',
            password: 'p',
            extra: 1,
        }),
    ).toEqual({ type: 'tab:fill-login', id: 'a', login: 'l', password: 'p' })
    expect(parseTabRequest({ type: 'tab:fill-code', code: 'ABCDE' })).toEqual({
        type: 'tab:fill-code',
        code: 'ABCDE',
    })
})

it('refuses a request missing a field, of another type, or no object', () => {
    expect(parseTabRequest({ type: 'tab:fill-login', id: 'a' })).toBeUndefined()
    expect(parseTabRequest({ type: 'tab:fill-code' })).toBeUndefined()
    expect(parseTabRequest({ type: 'autofill:state' })).toBeUndefined()
    expect(parseTabRequest(undefined)).toBeUndefined()
    expect(parseTabRequest('tab:context')).toBeUndefined()
})

it('reads the tab context, and no receiver as another site', () => {
    expect(readTabContext({ kind: 'signin', address: 'store/login' })).toEqual({
        kind: 'signin',
        address: 'store/login',
    })
    expect(readTabContext({ kind: 'guard', address: 'store/login' }).kind).toBe(
        'guard',
    )
    expect(readTabContext(undefined)).toEqual({ kind: 'other', address: '' })
    expect(readTabContext({ kind: 'admin', address: 'x' }).kind).toBe('other')
    expect(readTabContext({ kind: 'signin' }).kind).toBe('other')
})

it('counts a fill only when the tab said it filled', () => {
    expect(readFilled({ filled: true })).toBe(true)
    expect(readFilled({ filled: false })).toBe(false)
    expect(readFilled(undefined)).toBe(false)
    expect(readFilled({ filled: 'yes' })).toBe(false)
})
