import { describe, expect, it } from 'vitest'

import type { Account } from '#features/accounts'

import {
    clampSelection,
    isPaletteKeyIgnored,
    rankAccounts,
    stepSelection,
} from './picker'

function account(overrides: Partial<Account>): Account {
    return {
        id: 'a',
        nickname: 'alpha',
        login: 'alpha_login',
        anonymous: false,
        steamId: '1',
        level: 0,
        years: 0,
        since: '',
        hue: 0,
        bans: [],
        tags: [],
        pinned: false,
        guard: false,
        note: '',
        locked: false,
        added: 0,
        updated: 0,
        ...overrides,
    }
}

describe('rankAccounts', () => {
    const list = [
        account({ id: '1', nickname: 'Zed', login: 'zed_main' }),
        account({ id: '2', nickname: 'Halcyon', login: 'north', pinned: true }),
        account({ id: '3', nickname: 'Moss', login: 'moss', locked: true }),
        account({ id: '4', nickname: 'Kite', login: 'kite', pinned: true }),
    ]

    it('puts pinned accounts first and keeps vault order within each group', () => {
        expect(rankAccounts(list, '').map((a) => a.id)).toEqual([
            '2',
            '4',
            '1',
            '3',
        ])
    })

    it('matches nickname and login, ignoring case and outer spaces', () => {
        expect(rankAccounts(list, '  NORTH ').map((a) => a.id)).toEqual(['2'])
        expect(rankAccounts(list, 'zed').map((a) => a.id)).toEqual(['1'])
    })

    it('keeps the login of a locked account out of search', () => {
        expect(rankAccounts(list, 'moss').map((a) => a.id)).toEqual(['3'])
        const locked = [
            account({ nickname: 'Vault', login: 'secret', locked: true }),
        ]
        expect(rankAccounts(locked, 'secret')).toEqual([])
    })

    it('returns nothing when nothing matches', () => {
        expect(rankAccounts(list, 'zzz')).toEqual([])
    })
})

describe('stepSelection', () => {
    it('wraps past either end', () => {
        expect(stepSelection(2, 1, 3)).toBe(0)
        expect(stepSelection(0, -1, 3)).toBe(2)
    })

    it('stays at zero in an empty list', () => {
        expect(stepSelection(0, 1, 0)).toBe(0)
    })
})

describe('clampSelection', () => {
    it('pulls a stale index back into a shorter list', () => {
        expect(clampSelection(7, 3)).toBe(2)
        expect(clampSelection(7, 0)).toBe(0)
        expect(clampSelection(1, 3)).toBe(1)
    })
})

describe('isPaletteKeyIgnored', () => {
    const onButton = { closest: (s: string) => (s === 'button' ? {} : null) }
    const onInput = { closest: () => null }

    it('leaves a composing IME alone', () => {
        expect(
            isPaletteKeyIgnored({ isComposing: true, target: onInput }),
        ).toBe(true)
    })

    it('leaves a focused button its own Enter', () => {
        expect(
            isPaletteKeyIgnored({ isComposing: false, target: onButton }),
        ).toBe(true)
    })

    it('handles keys from the search field', () => {
        expect(
            isPaletteKeyIgnored({ isComposing: false, target: onInput }),
        ).toBe(false)
        expect(isPaletteKeyIgnored({ isComposing: false, target: null })).toBe(
            false,
        )
    })
})
