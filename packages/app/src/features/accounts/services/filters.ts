import {
    type Account,
    type AccountsView,
    BAN_KINDS,
    type BanFilterMode,
    type BanFilters,
    type SearchField,
    type SortDirection,
    type SortKey,
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
    return account[field].toLowerCase().includes(needle)
}

function matchesBans(account: Account, bans: BanFilters) {
    return BAN_KINDS.every((kind) => {
        const mode = bans[kind]
        if (mode === 'any') return true
        return account.bans.includes(kind) === (mode === 'require')
    })
}

export function hasActiveFilters({ query, bans }: AccountsView): boolean {
    return query.trim() !== '' || BAN_KINDS.some((kind) => bans[kind] !== 'any')
}

export function filterAccounts(
    accounts: readonly Account[],
    { query, field, bans }: AccountsView,
): Account[] {
    return accounts.filter(
        (account) =>
            matchesQuery(account, query, field) && matchesBans(account, bans),
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
