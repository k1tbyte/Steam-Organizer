import {
    type AccountData,
    type AccountSecret,
    type Authenticator,
    type LiveRecord,
    loginTag,
    type Movable,
    orderKeys,
    placeFields,
    publicData,
    RECORD,
    readSettings,
    SETTINGS_ID,
    type ServiceCredentials,
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

export interface NewAccount extends Omit<Movable, 'login'> {
    login: string
    password: string
    /** SteamID64; Add saves it with the profile Steam gave for it. */
    steamId: string | null
    steam?: SteamSnapshot
    /** The user's name for it; an anonymous account needs one. */
    alias?: string
    authenticator?: Authenticator
    /** An import brings these; Add leaves them at their defaults. */
    pinned?: boolean
    addedAt?: number
    tags?: string[]
    services?: ServiceCredentials[]
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

/** The logins and Steam IDs (or the tags an everything lock leaves) the accounts hold, as tags. */
async function identities(key: VaultKey, accounts: readonly StoredAccount[]) {
    const logins = new Set(accounts.map(({ data }) => data.loginTag))
    const steamTags = new Set(
        await Promise.all(accounts.map(({ data }) => steamTagOf(key, data))),
    )
    return {
        taken: (login: string, steam: string | null) =>
            logins.has(login)
                ? ('login-taken' as const)
                : steam !== null && steamTags.has(steam)
                  ? ('steam-taken' as const)
                  : undefined,
        remember(login: string, steam: string | null) {
            logins.add(login)
            if (steam !== null) steamTags.add(steam)
        },
    }
}

const steamTagOfNew = (key: VaultKey, account: NewAccount) =>
    account.steamId === null ? null : steamTag(key, account.steamId)

/** Whether the vault holds another account with this one's Steam ID (or the tag an everything lock leaves) or login. */
export async function heldIn(key: VaultKey, contents: Contents) {
    const held = await identities(key, storedAccounts(contents.data))
    return async (data: AccountData) =>
        held.taken(data.loginTag, await steamTagOf(key, data)) !== undefined
}

/** The sealed record of a new account, last in the vault order; a refusal when its login or Steam ID is stored. */
export async function newAccountRecord(
    key: VaultKey,
    contents: Contents,
    account: NewAccount,
    now: number,
): Promise<'login-taken' | 'steam-taken' | LiveRecord> {
    const stored = storedAccounts(contents.data)
    const tag = await loginTag(key, account.login)
    const refused = (await identities(key, stored)).taken(
        tag,
        await steamTagOfNew(key, account),
    )
    if (refused) return refused
    const [order] = orderKeys(stored.at(-1)?.data.order ?? null, null, 1) as [
        string,
    ]
    return sealNew(key, contents, account, { order, loginTag: tag, now })
}

/** New accounts in one batch, last in the vault order as given. One whose Steam ID, else login, the vault or an earlier
 *  one of the batch holds is skipped. */
export async function newAccountRecords(
    key: VaultKey,
    contents: Contents,
    accounts: readonly NewAccount[],
    now: number,
): Promise<{ records: LiveRecord[]; added: NewAccount[]; skipped: number }> {
    const stored = storedAccounts(contents.data)
    const held = await identities(key, stored)
    const added: { account: NewAccount; tag: string }[] = []
    for (const account of accounts) {
        const tag = await loginTag(key, account.login)
        const steam = await steamTagOfNew(key, account)
        if (held.taken(tag, steam)) continue
        held.remember(tag, steam)
        added.push({ account, tag })
    }
    const orders = orderKeys(
        stored.at(-1)?.data.order ?? null,
        null,
        added.length,
    )
    const records = await Promise.all(
        added.map(({ account, tag }, index) =>
            sealNew(key, contents, account, {
                order: orders[index] as string,
                loginTag: tag,
                now,
            }),
        ),
    )
    return {
        records,
        added: added.map(({ account }) => account),
        skipped: accounts.length - added.length,
    }
}

function sealNew(
    key: VaultKey,
    contents: Contents,
    account: NewAccount,
    at: { order: string; loginTag: string; now: number },
): Promise<LiveRecord> {
    const alias = account.alias?.trim()
    const { note, phone, email } = account
    const data: AccountData = {
        kind: RECORD.ACCOUNT,
        ...(alias && { alias }),
        login: account.login.trim(),
        ...(note && { note }),
        ...(phone && { phone }),
        ...(email && { email }),
        steamId: account.steamId,
        tags: account.tags ?? [],
        pinned: account.pinned ?? false,
        order: at.order,
        addedAt: account.addedAt ?? at.now,
        editedAt: at.now,
        guard: account.authenticator !== undefined,
        loginTag: at.loginTag,
        steam: account.steam ?? null,
    }
    const secret: AccountSecret = {
        password: account.password,
        services: account.services ?? [],
        ...(account.authenticator && { authenticator: account.authenticator }),
    }
    const placed = placeFields(data, secret, placementIn(contents.data))
    return sealRecord(key, {
        id: crypto.randomUUID(),
        updatedAt: at.now,
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
    const held = await identities(key, live)
    const back: TakenAccount[] = []
    for (const item of taken)
        if (!held.taken(item.data.loginTag, await steamTagOf(key, item.data)))
            back.push(item)
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
