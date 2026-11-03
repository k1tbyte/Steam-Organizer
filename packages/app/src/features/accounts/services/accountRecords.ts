import {
    type AccountData,
    type AccountSecret,
    type Authenticator,
    type LiveRecord,
    loginTag,
    orderKeys,
    placeFields,
    publicData,
    RECORD,
    readSettings,
    SETTINGS_ID,
    type SteamSnapshot,
    sealRecord,
    steamTag,
    updateData,
    type VaultKey,
} from '@so/core'

import { placedRecord } from './placedRecord'
import { type StoredAccount, storedAccounts } from './vaultAccounts'

interface Contents {
    data: ReadonlyMap<string, unknown>
}

export interface NewAccount {
    login: string
    password: string
    /** SteamID64; Add saves it with the profile Steam gave for it. */
    steamId: string | null
    steam?: SteamSnapshot
    /** The user's name for it; an anonymous account needs one. */
    alias?: string
    authenticator?: Authenticator
}

/** An account a deletion took, as it was stored. */
export interface TakenAccount {
    record: LiveRecord
    data: AccountData
}

const placementIn = (data: ReadonlyMap<string, unknown>) =>
    readSettings(data.get(SETTINGS_ID)).fieldDefaults

// An everything lock hides the Steam ID: its tag stands in, so accounts compare by tag.
async function steamTagOf(key: VaultKey, data: AccountData) {
    if (data.lock?.steamTag) return data.lock.steamTag
    return data.steamId === null ? null : steamTag(key, data.steamId)
}

const steamTagsIn = async (key: VaultKey, accounts: readonly StoredAccount[]) =>
    new Set(
        await Promise.all(accounts.map(({ data }) => steamTagOf(key, data))),
    )

/** The sealed record of a new account, last in the vault order; a refusal when its login or Steam ID is stored. */
export async function newAccountRecord(
    key: VaultKey,
    contents: Contents,
    account: NewAccount,
    now: number,
): Promise<'login-taken' | 'steam-taken' | LiveRecord> {
    const stored = storedAccounts(contents.data)
    const tag = await loginTag(key, account.login)
    if (stored.some(({ data }) => data.loginTag === tag)) return 'login-taken'
    if (account.steamId !== null) {
        const wanted = await steamTag(key, account.steamId)
        if ((await steamTagsIn(key, stored)).has(wanted)) return 'steam-taken'
    }
    const [order] = orderKeys(stored.at(-1)?.data.order ?? null, null, 1) as [
        string,
    ]
    const alias = account.alias?.trim()
    const data: AccountData = {
        kind: RECORD.ACCOUNT,
        ...(alias && { alias }),
        login: account.login.trim(),
        steamId: account.steamId,
        tags: [],
        pinned: false,
        order,
        addedAt: now,
        editedAt: now,
        guard: account.authenticator !== undefined,
        loginTag: tag,
        steam: account.steam ?? null,
    }
    const secret: AccountSecret = {
        password: account.password,
        services: [],
        ...(account.authenticator && { authenticator: account.authenticator }),
    }
    const placed = placeFields(data, secret, placementIn(contents.data))
    return sealRecord(key, {
        id: crypto.randomUUID(),
        updatedAt: now,
        data: placed.data,
        secret: placed.secret,
    })
}

/** The records an undone deletion writes: the same sealed ones, newer than their tombstones. A login or Steam ID added
 *  again meanwhile keeps its place. */
export async function restoredRecords(
    key: VaultKey,
    contents: Contents,
    taken: readonly TakenAccount[],
    updatedAt: number,
): Promise<LiveRecord[]> {
    const live = storedAccounts(contents.data)
    const logins = new Set(live.map(({ data }) => data.loginTag))
    const steamTags = await steamTagsIn(key, live)
    const back: TakenAccount[] = []
    for (const item of taken) {
        const tag = await steamTagOf(key, item.data)
        if (logins.has(item.data.loginTag)) continue
        if (tag === null || !steamTags.has(tag)) back.push(item)
    }
    // An add meanwhile may hold a restored order key (an emptied vault starts from the same one): that account goes last.
    const orders = new Set(live.map(({ data }) => data.order))
    let last =
        [...live, ...back]
            .map(({ data }) => data.order)
            .sort()
            .at(-1) ?? null
    return Promise.all(
        back.map(async ({ record, data }) => {
            let next = data
            if (orders.has(data.order)) {
                const [order] = orderKeys(last, null, 1) as [string]
                last = order
                next = { ...data, order, editedAt: updatedAt }
            }
            // A placement changed meanwhile puts the fields where it says now.
            const placed = await placedRecord(
                key,
                contents,
                record,
                next,
                updatedAt,
            )
            if (placed) return placed
            if (next === data) return { ...record, updatedAt }
            return updateData(key, record, publicData(next), updatedAt)
        }),
    )
}
