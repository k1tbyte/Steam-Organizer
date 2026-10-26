import {
    type AccountData,
    type AccountSecret,
    type Authenticator,
    type LiveRecord,
    loginTag,
    orderKeys,
    RECORD,
    sealRecord,
    updateData,
} from '@so/core'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

import { reportError } from '#core'

import { applyOrder, type Placement, placeBetween } from '../services/reorder'
import {
    placedKeys,
    type StoredAccount,
    storedAccounts,
    tagsIn,
} from '../services/vaultAccounts'
import { useAccountsViewStore } from '../stores/accountsView'
import { useAccountsSource } from './useAccountsSource'

export interface NewAccount {
    login: string
    password: string
    /** SteamID64; null when none was typed or the typed one needs Steam to resolve. */
    steamId: string | null
    /** The user's name for it; an anonymous account needs one. */
    alias?: string
    authenticator?: Authenticator
}

export type AddResult = 'added' | 'login-taken' | 'steam-taken'

/** The vault's accounts: the one source the list, the profile and the popup read, and the one writer of their records. */
export function useVaultAccounts() {
    const { session, sample, onVault } = useAccountsSource()
    const view = useAccountsViewStore()
    const { pins, order } = storeToRefs(view)

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
                    return [updateData(key, record, next, now)]
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
            else if (
                account.steamId !== null &&
                stored.some(({ data }) => data.steamId === account.steamId)
            )
                result = 'steam-taken'
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
                steam: null,
            }
            const secret: AccountSecret = {
                password: account.password,
                services: [],
                ...(account.authenticator && {
                    authenticator: account.authenticator,
                }),
            }
            const id = crypto.randomUUID()
            return [await sealRecord(key, { id, updatedAt: now, data, secret })]
        })
        return result
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
                const steamIds = new Set(live.map(({ data }) => data.steamId))
                const back = taken.filter(
                    ({ data }) =>
                        !logins.has(data.loginTag) &&
                        (data.steamId === null || !steamIds.has(data.steamId)),
                )
                // An add meanwhile may hold a restored order key (an emptied vault starts from the same one): that account goes last.
                const orders = new Set(live.map(({ data }) => data.order))
                let last =
                    [...live, ...back]
                        .map(({ data }) => data.order)
                        .sort()
                        .at(-1) ?? null
                return Promise.all(
                    back.map(({ record, data }) => {
                        if (!orders.has(data.order))
                            return { ...record, updatedAt }
                        const [order] = orderKeys(last, null, 1) as [string]
                        last = order
                        const moved = { ...data, order, editedAt: updatedAt }
                        return updateData(key, record, moved, updatedAt)
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
        return rewrite((stored, data) => {
            const live = new Set(tagsIn(data).map((tag) => tag.id))
            const keep = (id: string) => live.has(id) && !remove.includes(id)
            return new Map(
                stored.flatMap(({ id, data: { tags } }) => {
                    const next = [...new Set([...tags, ...add])].filter(keep)
                    const same =
                        next.length === tags.length &&
                        next.every((tag, i) => tag === tags[i])
                    return picked.has(id) && !same ? [[id, { tags: next }]] : []
                }),
            )
        })
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
        edit(id: string, patch: Partial<Pick<AccountData, 'alias' | 'note'>>) {
            return rewrite(() => new Map([[id, patch]]))
        },
        setTags,
        remove,
    }
}
