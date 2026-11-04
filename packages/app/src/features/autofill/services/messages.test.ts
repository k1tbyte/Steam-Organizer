import { expect, it } from 'vitest'

import { parseRequest, readCode, readLogin, readState } from './messages'

it('takes a known request with the id it needs, and nothing else', () => {
    expect(parseRequest({ type: 'autofill:state' })).toEqual({
        type: 'autofill:state',
    })
    for (const type of [
        'autofill:login',
        'autofill:code',
        'autofill:filled',
    ] as const)
        expect(parseRequest({ type, id: 'a' })).toEqual({ type, id: 'a' })
    expect(parseRequest({ type: 'autofill:login' })).toBeUndefined()
    expect(parseRequest({ type: 'autofill:login', id: '' })).toBeUndefined()
    expect(parseRequest({ type: 'autofill:login', id: 4 })).toBeUndefined()
    expect(parseRequest({ type: 'autofill:other', id: 'a' })).toBeUndefined()
    expect(parseRequest({ type: 'open-app', path: '/' })).toBeUndefined()
    expect(parseRequest(null)).toBeUndefined()
    expect(parseRequest('autofill:state')).toBeUndefined()
})

it('never takes the tab from the message', () => {
    expect(
        parseRequest({ type: 'autofill:login', id: 'a', tabId: 9, tab: 9 }),
    ).toEqual({ type: 'autofill:login', id: 'a' })
})

it('reads the picker fields of a row and drops the rest', () => {
    const answer = readState({
        state: 'unlocked',
        guardFor: 'a',
        accounts: [
            {
                id: 'a',
                nickname: 'Ash',
                login: 'ash',
                avatar: 'h',
                hue: 3,
                level: 7,
                guard: true,
                locked: false,
                pinned: true,
                anonymous: false,
                note: 'secret note',
                password: 'hunter2',
            },
            { nickname: 'no id' },
            'junk',
        ],
    })
    expect(answer).toEqual({
        state: 'unlocked',
        guardFor: 'a',
        accounts: [
            {
                id: 'a',
                nickname: 'Ash',
                login: 'ash',
                avatar: 'h',
                hue: 3,
                level: 7,
                guard: true,
                locked: false,
                pinned: true,
                anonymous: false,
            },
        ],
    })
})

it('reads an unknown or missing state as no answer', () => {
    expect(readState(undefined)).toBeUndefined()
    expect(readState({ state: 'open', accounts: [] })).toBeUndefined()
    expect(readState({ state: 'locked' })).toEqual({
        state: 'locked',
        accounts: [],
    })
})

it('reads a login, a code and a refusal', () => {
    expect(readLogin({ login: 'a', password: 'b', extra: 1 })).toEqual({
        login: 'a',
        password: 'b',
    })
    expect(readLogin({ refused: 'account-locked' })).toEqual({
        refused: 'account-locked',
    })
    expect(readLogin({ refused: 'anything' })).toBeUndefined()
    expect(readLogin({ login: 'a' })).toBeUndefined()
    expect(readCode({ code: 'ABCDE' })).toEqual({ code: 'ABCDE' })
    expect(readCode({ refused: 'gone' })).toEqual({ refused: 'gone' })
    expect(readCode(undefined)).toBeUndefined()
})
