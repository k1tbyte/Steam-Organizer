import {
    type AccountsView,
    BAN_KINDS,
    BAN_MODES,
    type BanFilters,
    type CardFlags,
    SEARCH_FIELDS,
    SORT_DIRECTIONS,
    SORT_KEYS,
} from '../model'
import { NO_BAN_FILTERS } from './filters'

export const DEFAULT_CARD_FLAGS: CardFlags = {
    level: true,
    age: true,
    id: true,
    bans: true,
    tags: true,
    guard: true,
    note: true,
    actions: true,
}

export const DEFAULT_VIEW: AccountsView = {
    query: '',
    field: 'nickname',
    bans: NO_BAN_FILTERS,
    sort: 'updated',
    direction: 'desc',
}

function parseRecord(raw: string | null): Record<string, unknown> {
    try {
        const value: unknown = JSON.parse(raw ?? '')
        return typeof value === 'object' && value !== null
            ? (value as Record<string, unknown>)
            : {}
    } catch {
        return {}
    }
}

function oneOf<T extends string>(
    allowed: readonly T[],
    value: unknown,
    fallback: T,
): T {
    return allowed.includes(value as T) ? (value as T) : fallback
}

/** Stored text back to flags: a missing or malformed entry reads as its default. */
export function parseCardFlags(raw: string | null): CardFlags {
    const stored = parseRecord(raw)
    return Object.fromEntries(
        Object.entries(DEFAULT_CARD_FLAGS).map(([key, fallback]) => [
            key,
            typeof stored[key] === 'boolean' ? stored[key] : fallback,
        ]),
    ) as unknown as CardFlags
}

export function parseView(raw: string | null): AccountsView {
    const stored = parseRecord(raw)
    const bans = (stored.bans ?? {}) as Record<string, unknown>
    return {
        query: typeof stored.query === 'string' ? stored.query : '',
        field: oneOf(SEARCH_FIELDS, stored.field, DEFAULT_VIEW.field),
        bans: Object.fromEntries(
            BAN_KINDS.map((kind) => [
                kind,
                oneOf(BAN_MODES, bans[kind], 'any'),
            ]),
        ) as BanFilters,
        sort: oneOf(SORT_KEYS, stored.sort, DEFAULT_VIEW.sort),
        direction: oneOf(
            SORT_DIRECTIONS,
            stored.direction,
            DEFAULT_VIEW.direction,
        ),
    }
}
