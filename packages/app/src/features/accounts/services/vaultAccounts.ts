import {
    type AccountData,
    orderKeys,
    readAccount,
    readTag,
    type SteamBans,
} from '@so/core'

import { toAccountId } from '../../../core/steamId'
import type { Account, AccountTag, BanKind } from '../model'
import { type Placement, placeBetween } from './reorder'

export interface StoredAccount {
    id: string
    data: AccountData
}

const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000

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

function bansOf(bans: SteamBans): BanKind[] {
    const found: [BanKind, boolean][] = [
        ['vac', bans.vac > 0],
        ['game', bans.game > 0],
        ['community', bans.community],
        ['economy', bans.economy !== 'none'],
    ]
    return found.flatMap(([kind, banned]) => (banned ? [kind] : []))
}

function hueOf(id: string) {
    let hue = 0
    for (const char of id) hue = (hue * 31 + char.charCodeAt(0)) % 360
    return hue
}

function toAccount(
    { id, data }: StoredAccount,
    tags: ReadonlyMap<string, AccountTag>,
): Account {
    const { steam } = data
    const registered = steam?.registeredAt ?? null
    return {
        id,
        nickname: data.alias ?? steam?.nickname ?? data.login ?? '',
        alias: data.alias ?? null,
        steamNickname: steam?.nickname ?? null,
        login: data.login ?? '',
        anonymous: data.steamId === null,
        steamId: data.steamId && toAccountId(data.steamId),
        level: steam?.level ?? 0,
        years:
            steam && registered !== null
                ? (steam.refreshedAt - registered) / YEAR_MS
                : 0,
        since:
            registered === null
                ? ''
                : new Date(registered).toLocaleDateString(undefined, {
                      month: 'short',
                      year: 'numeric',
                  }),
        hue: hueOf(id),
        bans: steam ? bansOf(steam.bans) : [],
        tags: data.tags.flatMap((tag) => tags.get(tag) ?? []),
        pinned: data.pinned,
        guard: data.guard,
        note: data.note ?? '',
        locked: false,
        added: data.addedAt,
        updated: steam?.refreshedAt ?? data.addedAt,
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
    const tags = new Map(tagsIn(data).map((tag) => [tag.id, tag]))
    const accounts = storedAccounts(data).map((account) =>
        toAccount(account, tags),
    )
    mapped.set(data, accounts)
    return accounts
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
