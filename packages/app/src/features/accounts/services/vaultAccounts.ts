import {
    type AccountData,
    orderKeys,
    readAccount,
    readSettings,
    readTag,
    SETTINGS_ID,
    type SteamBans,
    type SteamSnapshot,
    toAccountId,
} from '@so/core'

import type { Account, AccountTag, BanKind } from '../model'
import { type Placement, placeBetween } from './reorder'

export interface StoredAccount {
    id: string
    data: AccountData
}

const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000

/** Years on Steam at the refresh, to a tenth (the card shows 7.2y); 0 when the profile hides its registration. */
export function steamYears(steam: SteamSnapshot | null): number {
    if (steam?.registeredAt == null) return 0
    return (
        Math.floor(((steam.refreshedAt - steam.registeredAt) / YEAR_MS) * 10) /
        10
    )
}

// Fractional keys sort by code unit, never by locale.
const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

/** The vault's accounts in its order. */
export function storedAccounts(
    data: ReadonlyMap<string, unknown>,
): StoredAccount[] {
    const accounts: StoredAccount[] = []
    for (const [id, value] of data) {
        const account = readAccount(value)
        if (account) accounts.push({ id, data: account })
    }
    return accounts.sort(
        (a, b) => compare(a.data.order, b.data.order) || compare(a.id, b.id),
    )
}

export function bansOf(bans: SteamBans): BanKind[] {
    const found: [BanKind, boolean][] = [
        ['vac', bans.vac > 0],
        ['game', bans.game > 0],
        ['community', bans.community],
        ['economy', bans.economy !== 'none'],
    ]
    return found.flatMap(([kind, banned]) => (banned ? [kind] : []))
}

/** The avatar tint until a real avatar shows, stable per id. */
export function hueOf(id: string) {
    let hue = 0
    for (const char of id) hue = (hue * 31 + char.charCodeAt(0)) % 360
    return hue
}

function toAccount(
    { id, data }: StoredAccount,
    tags: ReadonlyMap<string, AccountTag>,
    noteSecret: boolean,
): Account {
    const { steam, lock } = data
    const registered = steam?.registeredAt ?? null
    const avatar = steam?.avatar ?? lock?.shown?.avatar
    return {
        id,
        nickname:
            data.alias ??
            steam?.nickname ??
            lock?.shown?.nickname ??
            data.login ??
            '',
        alias: data.alias ?? null,
        steamNickname: steam?.nickname ?? lock?.shown?.nickname ?? null,
        login: data.login ?? '',
        anonymous: data.steamId === null,
        steamId: data.steamId && toAccountId(data.steamId),
        level: steam?.level ?? 0,
        years: steamYears(steam),
        since:
            registered === null
                ? ''
                : new Date(registered).toLocaleDateString(undefined, {
                      month: 'short',
                      year: 'numeric',
                  }),
        hue: hueOf(id),
        ...(avatar && { avatar }),
        bans: steam ? bansOf(steam.bans) : [],
        tags: data.tags.flatMap((tag) => tags.get(tag) ?? []),
        pinned: data.pinned,
        guard: data.guard,
        note: data.note ?? '',
        ...(noteSecret && { noteSecret }),
        ...(data.phone && { phone: data.phone }),
        ...(data.email && { email: data.email }),
        ...(lock && {
            lock: {
                scope: lock.scope,
                recovery: lock.slots.recovery !== undefined,
            },
        }),
        // Open only while the session holds its key: `useAccountsSource` lifts it.
        locked: lock !== undefined,
        added: data.addedAt,
        updated: steam?.refreshedAt ?? data.addedAt,
        ...(steam && { steam }),
    }
}

/** The vault's live tags, by label. */
export function tagsIn(data: ReadonlyMap<string, unknown>): AccountTag[] {
    const tags: AccountTag[] = []
    for (const [id, value] of data) {
        const tag = readTag(value)
        if (tag) tags.push({ id, label: tag.label, hue: tag.hue })
    }
    return tags.sort((a, b) => a.label.localeCompare(b.label))
}

// Every reader maps the same contents: once per change, which brings a new map.
const mapped = new WeakMap<ReadonlyMap<string, unknown>, readonly Account[]>()

/** The vault's accounts as the list shows them, in the vault order. */
export function accountsIn(
    data: ReadonlyMap<string, unknown>,
): readonly Account[] {
    const cached = mapped.get(data)
    if (cached) return cached
    const accounts = storedAccounts(data).map(accountMapper(data))
    mapped.set(data, accounts)
    return accounts
}

function accountMapper(data: ReadonlyMap<string, unknown>) {
    const tags = new Map(tagsIn(data).map((tag) => [tag.id, tag]))
    const noteSecret =
        readSettings(data.get(SETTINGS_ID)).fieldDefaults.note === 'secret'
    return (account: StoredAccount) => toAccount(account, tags, noteSecret)
}

/** An open account with what its `everything` lock hid joined back, as its profile shows it. */
export function wholeAccount(
    data: ReadonlyMap<string, unknown>,
    id: string,
    hidden: Partial<AccountData>,
): Account | undefined {
    const stored = readAccount(data.get(id))
    if (!stored) return undefined
    const account = accountMapper(data)({ id, data: { ...stored, ...hidden } })
    return { ...account, locked: false }
}

/** New order keys for the moved accounts: between their neighbours in the whole vault order, so hidden ones keep their places. */
export function placedKeys(
    accounts: readonly StoredAccount[],
    placement: Placement,
): Map<string, string> {
    const order = new Map(accounts.map(({ id, data }) => [id, data.order]))
    const ids = placement.ids.filter((id) => order.has(id))
    const anchor = placement.after ?? placement.before
    if (ids.length === 0 || (anchor !== null && !order.has(anchor)))
        return new Map()
    const next = placeBetween([...order.keys()], { ...placement, ids })
    const at = next.indexOf(ids[0] as string)
    const keys = orderKeys(
        order.get(next[at - 1] ?? '') ?? null,
        order.get(next[at + ids.length] ?? '') ?? null,
        ids.length,
    )
    return new Map(ids.map((id, index) => [id, keys[index] as string]))
}
