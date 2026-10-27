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
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

import { reportError } from '#core'

import { placedRecord } from '../services/placedRecord'
import { applyOrder, type Placement, placeBetween } from '../services/reorder'
import {
    placedKeys,
    type StoredAccount,
    storedAccounts,
    tagsIn,
} from '../services/vaultAccounts'
import { useAccountsViewStore } from '../stores/accountsView'
import { useEditSecret } from './secrets/useEditSecret'
import { useAccountsSource } from './useAccountsSource'

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

export type AddResult = 'added' | 'login-taken' | 'steam-taken'

/** The vault's accounts: the one source the list, the profile and the popup read, and the one writer of their records. */
type UserFields = Partial<Pick<AccountData, 'alias' | 'note'>>

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

export function useVaultAccounts() {
    const { session, sample, onVault } = useAccountsSource()
    const view = useAccountsViewStore()
    const { pins, order } = storeToRefs(view)
    const editSecret = useEditSecret()

    const accounts = computed(() => {
        const withPins = (sample.value?.accounts ?? []).map((account) => {
            const pinned = pins.value[account.id]
            return pinned === undefined ? account : { ...account, pinned }
        })
        return order.value ? applyOrder(withPins, order.value) : withPins
    })

    function rewrite(
        patches: (
            accounts: StoredAccount[],
            data: ReadonlyMap<string, unknown>,
        ) => ReadonlyMap<string, Partial<AccountData>>,
    ): Promise<void> {
        // A sample keeps only the view store's pins and order.
        if (!onVault.value) return Promise.resolve()
        const write = session.transact(async (contents, key) => {
            const now = Date.now()
            const accounts = storedAccounts(contents.data)
            const byId = new Map(accounts.map(({ id, data }) => [id, data]))
            const changes = patches(accounts, contents.data)
            return Promise.all(
                contents.records.flatMap((record) => {
                    const data = byId.get(record.id)
                    const patch = changes.get(record.id)
                    if ('deleted' in record || !data || !patch) return []
                    const next = { ...data, ...patch, editedAt: now }
                    return [updateData(key, record, publicData(next), now)]
                }),
            )
        })
        view.settle(write).catch((error) => reportError(error, 'accounts'))
        return write
    }

    function setPinned(ids: Iterable<string>, pinned: boolean) {
        const picked = new Set(ids)
        for (const id of picked) view.setPinned(id, pinned)
        rewrite(
            (stored) =>
                new Map(
                    stored
                        .filter(
                            ({ id, data }) =>
                                picked.has(id) && data.pinned !== pinned,
                        )
                        .map(({ id }) => [id, { pinned }]),
                ),
        )
    }

    async function add(account: NewAccount): Promise<AddResult> {
        // A sample takes no new accounts.
        if (!onVault.value) return 'added'
        let result: AddResult = 'added'
        await session.transact(async (contents, key) => {
            const stored = storedAccounts(contents.data)
            const tag = await loginTag(key, account.login)
            if (stored.some(({ data }) => data.loginTag === tag))
                result = 'login-taken'
            else if (account.steamId !== null) {
                const wanted = await steamTag(key, account.steamId)
                const tags = await steamTagsIn(key, stored)
                if (tags.has(wanted)) result = 'steam-taken'
            }
            if (result !== 'added') return []
            const now = Date.now()
            const [order] = orderKeys(
                stored.at(-1)?.data.order ?? null,
                null,
                1,
            ) as [string]
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
                ...(account.authenticator && {
                    authenticator: account.authenticator,
                }),
            }
            const id = crypto.randomUUID()
            const placed = placeFields(data, secret, placementIn(contents.data))
            return [
                await sealRecord(key, {
                    id,
                    updatedAt: now,
                    data: placed.data,
                    secret: placed.secret,
                }),
            ]
        })
        return result
    }

    /** A note goes where the vault keeps notes; a stale copy in the other part goes too. Rejects on a locked account,
     *  so the note editor keeps the draft and offers Retry. */
    async function editPlaced(id: string, patch: UserFields): Promise<void> {
        if (!onVault.value) return
        const saved = await editSecret(id, ({ note: _, ...secret }, data) => ({
            secret,
            data: { ...data, ...patch },
        }))
        if (!saved) throw new Error('The account is locked')
    }

    /** Leaves tombstones, so a sync tells the deletion from an account another copy never had; resolves to the undo. */
    async function remove(ids: Iterable<string>): Promise<() => Promise<void>> {
        if (!onVault.value) return async () => {}
        const picked = new Set(ids)
        const taken: { record: LiveRecord; data: AccountData }[] = []
        await session.transact(async (contents) => {
            const updatedAt = Date.now()
            const records = new Map(contents.records.map((r) => [r.id, r]))
            const removed = storedAccounts(contents.data).filter(({ id }) =>
                picked.has(id),
            )
            for (const { id, data } of removed)
                taken.push({ record: records.get(id) as LiveRecord, data })
            return removed.map(({ id }) => ({
                id,
                updatedAt,
                deleted: true as const,
            }))
        })
        // The same sealed record, newer than its tombstone; a login or Steam ID added again meanwhile keeps its place.
        return () =>
            session.transact(async (contents, key) => {
                const updatedAt = Date.now()
                const live = storedAccounts(contents.data)
                const logins = new Set(live.map(({ data }) => data.loginTag))
                const steamTags = await steamTagsIn(key, live)
                const back: typeof taken = []
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
                        return updateData(
                            key,
                            record,
                            publicData(next),
                            updatedAt,
                        )
                    }),
                )
            })
    }

    /** Puts tags on the accounts and takes others off; ids of deleted tags drop on the way. */
    function setTags(
        ids: Iterable<string>,
        { add = [], remove = [] }: { add?: string[]; remove?: string[] },
    ) {
        const picked = new Set(ids)
        const retag = (
            tags: readonly string[],
            data: ReadonlyMap<string, unknown>,
        ) => {
            const live = new Set(tagsIn(data).map((tag) => tag.id))
            return [...new Set([...tags, ...add])].filter(
                (id) => live.has(id) && !remove.includes(id),
            )
        }
        const sealed = (data: AccountData) => data.lock?.scope === 'everything'
        // An everything lock seals the tags with the rest: they change with the secret, while the account is open.
        const contents = session.contents
        if (onVault.value && contents) {
            for (const { id, data } of storedAccounts(contents.data)) {
                if (picked.has(id) && sealed(data)) {
                    void editSecret(id, (secret, whole) => ({
                        secret,
                        data: {
                            ...whole,
                            tags: retag(whole.tags, contents.data),
                        },
                    }))
                }
            }
        }

        return rewrite(
            (stored, data) =>
                new Map(
                    stored.flatMap(({ id, data: account }) => {
                        if (!picked.has(id) || sealed(account)) return []
                        const { tags } = account
                        const next = retag(tags, data)
                        const same =
                            next.length === tags.length &&
                            next.every((tag, i) => tag === tags[i])
                        return same ? [] : [[id, { tags: next }]]
                    }),
                ),
        )
    }

    return {
        accounts,
        /** A sample may open the list on a search, so "no results" can be reviewed without typing. */
        presetQuery: computed(() => sample.value?.query),
        togglePin(id: string) {
            const current = accounts.value.find((a) => a.id === id)?.pinned
            setPinned([id], !current)
        },
        setPinned,
        /** Moves accounts within their group; only the moved ones change places. */
        move(placement: Placement) {
            view.setOrder(
                placeBetween(
                    accounts.value.map((a) => a.id),
                    placement,
                ),
            )
            rewrite((stored) => {
                const keys = placedKeys(stored, placement)
                return new Map([...keys].map(([id, order]) => [id, { order }]))
            })
        },
        add,
        /** The user's own fields of one account; an alias left out shows the Steam nickname. */
        edit(id: string, patch: UserFields) {
            if (patch.note === undefined)
                return rewrite(() => new Map([[id, patch]]))
            const write = editPlaced(id, patch)
            view.settle(write).catch((error) => reportError(error, 'accounts'))
            return write
        },
        setTags,
        remove,
    }
}
