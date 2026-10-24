import {
    type AccountData,
    type AccountSecret,
    loginTag,
    orderKeys,
    RECORD,
    sealRecord,
    updateData,
} from '@so/core'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

import { reportError, useMock } from '#core'
import { useVaultSession } from '#features/vault'

import { type AccountsSample, accountsMock } from '../mocks'
import { applyOrder, type Placement, placeBetween } from '../services/reorder'
import {
    accountsIn,
    placedKeys,
    type StoredAccount,
    storedAccounts,
} from '../services/vaultAccounts'
import { useAccountsViewStore } from '../stores/accountsView'

export interface NewAccount {
    login: string
    password: string
    /** SteamID64; null when none was typed or the typed one needs Steam to resolve. */
    steamId: string | null
}

export type AddResult = 'added' | 'login-taken' | 'steam-taken'

/** The vault's accounts: the one source the list, the profile and the popup read, and the one writer of pins, order and new accounts. */
export function useVaultAccounts() {
    const session = useVaultSession()
    const view = useAccountsViewStore()
    const { pins, order } = storeToRefs(view)
    const real = computed<AccountsSample | undefined>(() =>
        session.contents
            ? { accounts: accountsIn(session.contents.data) }
            : undefined,
    )
    const sample = useMock(() => real.value, accountsMock)
    // Mock mode shows a sample over an open vault: its pins and moves stay in the view store.
    const onVault = computed(
        () => real.value !== undefined && sample.value === real.value,
    )

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
        ) => ReadonlyMap<string, Partial<AccountData>>,
    ) {
        if (!onVault.value) return
        const write = session.transact(async (contents, key) => {
            const now = Date.now()
            const accounts = storedAccounts(contents.data)
            const byId = new Map(accounts.map(({ id, data }) => [id, data]))
            const changes = patches(accounts)
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
            const data: AccountData = {
                kind: RECORD.ACCOUNT,
                login: account.login.trim(),
                steamId: account.steamId,
                tags: [],
                pinned: false,
                order,
                addedAt: now,
                editedAt: now,
                guard: false,
                loginTag: tag,
                steam: null,
            }
            const secret: AccountSecret = {
                password: account.password,
                services: [],
            }
            const id = crypto.randomUUID()
            return [await sealRecord(key, { id, updatedAt: now, data, secret })]
        })
        return result
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
    }
}
