import type { FieldDefaults } from '@so/core'

import {
    type Account,
    type AccountsView,
    type AccountTag,
    BAN_KINDS,
    type BanFilterMode,
    type BanFilters,
    SEARCH_FIELDS,
    type SearchField,
    type SortDirection,
    type SortKey,
    type TagMatch,
} from '../model'

const NEXT_MODE: Record<BanFilterMode, BanFilterMode> = {
    any: 'require',
    require: 'exclude',
    exclude: 'any',
}

/** One chip click: ignore, then require, then exclude, then ignore again. */
export function nextBanMode(mode: BanFilterMode): BanFilterMode {
    return NEXT_MODE[mode]
}

export const NO_BAN_FILTERS: BanFilters = {
    vac: 'any',
    game: 'any',
    community: 'any',
    economy: 'any',
}

function matchesQuery(account: Account, query: string, field: SearchField) {
    const needle = query.trim().toLowerCase()
    if (needle === '') return true
    // A locked account keeps its secrets out of search; only the nickname stays public.
    if (account.locked && field !== 'nickname') return false
    // The Steam nickname still finds an account renamed by an alias.
    const values =
        field === 'nickname'
            ? [account.nickname, account.steamNickname ?? '']
            : [account[field] ?? '']
    return values.some((value) => value.toLowerCase().includes(needle))
}

function matchesBans(account: Account, bans: BanFilters) {
    return BAN_KINDS.every((kind) => {
        const mode = bans[kind]
        if (mode === 'any') return true
        return account.bans.includes(kind) === (mode === 'require')
    })
}

function matchesTags(account: Account, ids: string[], match: TagMatch) {
    if (ids.length === 0) return true
    const worn = new Set(account.tags.map((tag) => tag.id))
    return match === 'all'
        ? ids.every((id) => worn.has(id))
        : ids.some((id) => worn.has(id))
}

export function hasActiveFilters({ query, bans, tags }: AccountsView): boolean {
    return (
        query.trim() !== '' ||
        BAN_KINDS.some((kind) => bans[kind] !== 'any') ||
        tags.length > 0
    )
}

/** The view without deleted tags in its filter: no menu lists them, so nobody could uncheck one. */
export function withLiveTags(
    view: AccountsView,
    tags: readonly AccountTag[],
): AccountsView {
    const live = new Set(tags.map((tag) => tag.id))
    return { ...view, tags: view.tags.filter((id) => live.has(id)) }
}

/** The fields search reads: the nickname, and the movable ones the vault keeps searchable. */
export const searchableFields = (placement: FieldDefaults) =>
    SEARCH_FIELDS.filter(
        (field) => field === 'nickname' || placement[field] === 'searchable',
    )

/** The picked field, or the nickname once the vault keeps the picked one secret. */
export const searchFieldIn = (field: SearchField, placement: FieldDefaults) =>
    searchableFields(placement).includes(field) ? field : 'nickname'

/** Pass the view through `withLiveTags` and `searchFieldIn` first. */
export function filterAccounts(
    accounts: readonly Account[],
    { query, field, bans, tags, tagMatch }: AccountsView,
): Account[] {
    return accounts.filter(
        (account) =>
            matchesQuery(account, query, field) &&
            matchesBans(account, bans) &&
            matchesTags(account, tags, tagMatch),
    )
}

// Ascending reads oldest, stalest or lowest first; a registration is older the more years it has.
const SORT_VALUE: Record<Exclude<SortKey, 'vault'>, (a: Account) => number> = {
    created: (a) => -a.years,
    added: (a) => a.added,
    updated: (a) => a.updated,
    level: (a) => a.level,
}

/** The vault's own order stays as it is; any other key sorts a copy. */
export function sortAccounts(
    accounts: readonly Account[],
    sort: SortKey,
    direction: SortDirection,
): Account[] {
    if (sort === 'vault') return [...accounts]
    const value = SORT_VALUE[sort]
    const sign = direction === 'asc' ? 1 : -1
    return [...accounts].sort((a, b) => sign * (value(a) - value(b)))
}
