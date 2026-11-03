import {
    type AccountData,
    type LiveRecord,
    publicData,
    updateData,
    type VaultKey,
} from '@so/core'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

import { reportError } from '#core'

import type { VaultContents } from '#features/vault'

import {
    type NewAccount,
    newAccountRecord,
    newAccountRecords,
    restoredRecords,
    type TakenAccount,
} from '../services/accountRecords'
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

export type { NewAccount }

export type AddResult = 'added' | 'login-taken' | 'steam-taken'

/** Accounts for one write, made in the write queue from the latest records, with the records they need (new tags, services). */
export type AccountsBatch = (
    contents: VaultContents,
    key: VaultKey,
) => Promise<{ accounts: NewAccount[]; records?: LiveRecord[] }>

type UserFields = Partial<Pick<AccountData, 'alias' | 'note'>>

/** The vault's accounts: the one source the list, the profile and the popup read, and the one writer of their records. */
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
            const record = await newAccountRecord(
                key,
                contents,
                account,
                Date.now(),
            )
            if (typeof record === 'string') {
                result = record
                return []
            }
            return [record]
        })
        return result
    }

    /** Many accounts in one write; one the vault already holds (its Steam ID, else its login) is skipped and counted.
     *  A record the batch brings goes only with an account that uses it. */
    async function addMany(
        batch: AccountsBatch,
    ): Promise<{ added: number; skipped: number }> {
        const result = { added: 0, skipped: 0 }
        if (!onVault.value) return result
        await session.transact(async (contents, key) => {
            const { accounts, records = [] } = await batch(contents, key)
            const made = await newAccountRecords(
                key,
                contents,
                accounts,
                Date.now(),
            )
            result.added = made.added.length
            result.skipped = made.skipped
            const used = new Set(
                made.added.flatMap((account) => [
                    ...(account.tags ?? []),
                    ...(account.services ?? []).map(({ service }) => service),
                ]),
            )
            return [
                ...records.filter((record) => used.has(record.id)),
                ...made.records,
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
        const taken: TakenAccount[] = []
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
        return () =>
            session.transact((contents, key) =>
                restoredRecords(key, contents, taken, Date.now()),
            )
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
        /** No contents yet (the vault opening or closing) and no sample: the list waits instead of showing it empty. */
        loading: computed(() => sample.value === undefined),
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
        addMany,
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
