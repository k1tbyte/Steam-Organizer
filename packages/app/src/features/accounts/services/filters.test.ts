import { FIELD_DEFAULTS } from '@so/core'
import { describe, expect, it } from 'vitest'

import type { Account, AccountsView } from '../model'
import {
    filterAccounts,
    hasActiveFilters,
    NO_BAN_FILTERS,
    nextBanMode,
    searchFieldIn,
    sortAccounts,
} from './filters'

function account(patch: Partial<Account>): Account {
    return {
        id: 'x',
        nickname: 'x',
        alias: null,
        steamNickname: null,
        login: 'x',
        anonymous: false,
        steamId: '1',
        level: 0,
        years: 1,
        since: 'Jan 2024',
        hue: 0,
        bans: [],
        tags: [],
        pinned: false,
        guard: false,
        note: '',
        locked: false,
        added: 0,
        updated: 0,
        ...patch,
    }
}

const view = (patch: Partial<AccountsView> = {}): AccountsView => ({
    query: '',
    field: 'nickname',
    bans: NO_BAN_FILTERS,
    tags: [],
    tagMatch: 'any',
    sort: 'vault',
    direction: 'desc',
    ...patch,
})

const kyzz = account({
    id: 'a',
    nickname: 'kyzzdef',
    login: 'login_a',
    note: 'Main trade',
})
const vac = account({
    id: 'b',
    nickname: 'bunny hop',
    login: 'login_b',
    bans: ['vac'],
})
const locked = account({
    id: 'c',
    nickname: 'Dorado',
    login: 'secret_c',
    note: 'Main',
    locked: true,
})
const all = [kyzz, vac, locked]
const ids = (list: Account[]) => list.map((a) => a.id)

describe('nextBanMode', () => {
    it('cycles any, require, exclude', () => {
        expect(nextBanMode('any')).toBe('require')
        expect(nextBanMode('require')).toBe('exclude')
        expect(nextBanMode('exclude')).toBe('any')
    })
})

describe('filterAccounts', () => {
    it('matches the query case-insensitively in the chosen field', () => {
        expect(ids(filterAccounts(all, view({ query: 'KYZZ' })))).toEqual(['a'])
        expect(
            ids(
                filterAccounts(all, view({ query: 'login_b', field: 'login' })),
            ),
        ).toEqual(['b'])
        expect(ids(filterAccounts(all, view({ query: 'login_b' })))).toEqual([])
    })

    it('finds an account by its alias and by the Steam nickname behind it', () => {
        const renamed = account({
            id: 'r',
            nickname: 'Main · Faceit',
            alias: 'Main · Faceit',
            steamNickname: 'nightjar',
        })
        for (const query of ['faceit', 'NIGHT'])
            expect(ids(filterAccounts([renamed], view({ query })))).toEqual([
                'r',
            ])
    })

    it('keeps a locked account out of login and note search', () => {
        expect(
            ids(filterAccounts(all, view({ query: 'main', field: 'note' }))),
        ).toEqual(['a'])
        expect(
            ids(filterAccounts(all, view({ query: 'secret', field: 'login' }))),
        ).toEqual([])
        expect(ids(filterAccounts(all, view({ query: 'dorado' })))).toEqual([
            'c',
        ])
    })

    it('requires and excludes bans together', () => {
        const required = view({ bans: { ...NO_BAN_FILTERS, vac: 'require' } })
        expect(ids(filterAccounts(all, required))).toEqual(['b'])
        const excluded = view({ bans: { ...NO_BAN_FILTERS, vac: 'exclude' } })
        expect(ids(filterAccounts(all, excluded))).toEqual(['a', 'c'])
        const clash = view({
            bans: { ...NO_BAN_FILTERS, vac: 'require', game: 'require' },
        })
        expect(filterAccounts(all, clash)).toEqual([])
    })

    it('matches any or every picked tag', () => {
        const tag = (id: string) => ({ id, label: id, hue: 0 })
        const tagged = [
            account({ id: 'm', tags: [tag('main')] }),
            account({ id: 'mt', tags: [tag('main'), tag('trade')] }),
            account({ id: 'n' }),
        ]
        const picked = ['main', 'trade']
        expect(ids(filterAccounts(tagged, view({ tags: picked })))).toEqual([
            'm',
            'mt',
        ])
        expect(
            ids(
                filterAccounts(tagged, view({ tags: picked, tagMatch: 'all' })),
            ),
        ).toEqual(['mt'])
        expect(hasActiveFilters(view({ tags: ['main'] }))).toBe(true)
    })
})

describe('hasActiveFilters', () => {
    it('is true for a query or any ban mode', () => {
        expect(hasActiveFilters(view())).toBe(false)
        expect(hasActiveFilters(view({ query: ' ' }))).toBe(false)
        expect(hasActiveFilters(view({ query: 'a' }))).toBe(true)
        expect(
            hasActiveFilters(
                view({ bans: { ...NO_BAN_FILTERS, game: 'exclude' } }),
            ),
        ).toBe(true)
    })
})

describe('sortAccounts', () => {
    const list = [
        account({ id: 'a', level: 5, updated: 10, years: 2 }),
        account({ id: 'b', level: 50, updated: 30, years: 20 }),
        account({ id: 'c', level: 20, updated: 20, years: 9 }),
    ]

    it('sorts by key and direction without touching the input', () => {
        expect(ids(sortAccounts(list, 'level', 'desc'))).toEqual([
            'b',
            'c',
            'a',
        ])
        expect(ids(sortAccounts(list, 'updated', 'asc'))).toEqual([
            'a',
            'c',
            'b',
        ])
        expect(ids(list)).toEqual(['a', 'b', 'c'])
    })

    it('reads created ascending as the oldest registration first', () => {
        expect(ids(sortAccounts(list, 'created', 'asc'))).toEqual([
            'b',
            'c',
            'a',
        ])
    })

    it('keeps the vault order', () => {
        expect(ids(sortAccounts(list, 'vault', 'asc'))).toEqual(['a', 'b', 'c'])
    })
})

describe('searchFieldIn', () => {
    it('keeps a field the vault keeps searchable and falls back to the nickname otherwise', () => {
        const placement = {
            ...FIELD_DEFAULTS,
            phone: 'searchable',
            login: 'secret',
        } as const
        expect(searchFieldIn('phone', placement)).toBe('phone')
        expect(searchFieldIn('login', placement)).toBe('nickname')
        expect(searchFieldIn('email', placement)).toBe('nickname')
    })
})
