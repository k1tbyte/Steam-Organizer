import { onScopeDispose } from 'vue'

import { reportError } from '#core'
import {
    type Account,
    useAccountCredentials,
    useVaultAccounts,
} from '#features/accounts'
import type { PickerAccount } from '#features/quick-access'
import { useGuardCodes } from '#features/steam-guard'
import { type AutoLock, sessionBound, useVaultSession } from '#features/vault'

import type {
    CodeAnswer,
    LoginAnswer,
    Refused,
    StateAnswer,
    VaultHostServe,
} from '../model'
import { parseRequest } from '../services/messages'
import { tabFillKey } from '../services/tabFills'

// An account with its own password opens per page, and the host never holds its key: it never fills one.
const ownPassword = ({ locked, lock }: Account) => locked || lock !== undefined

// Field by field: nothing else of an account (notes, phone, email, Steam snapshot) leaves the host.
const pickerOf = (account: Account): PickerAccount => {
    const locked = ownPassword(account)
    return {
        id: account.id,
        nickname: account.nickname,
        login: locked ? '' : account.login,
        ...(account.avatar && { avatar: account.avatar }),
        hue: account.hue,
        level: account.level,
        guard: account.guard,
        locked,
        pinned: account.pinned,
        anonymous: account.anonymous,
    }
}

/** Answers the injected UI from the vault session this page holds: the list of picker rows, and one login and password
 *  or one Guard code at the moment of a fill. Before every answer it looks again, because a host lives long and may
 *  have slept: the lock policy, and the open vault's stored file. Keeps no decrypted secret beyond the session's own. */
export function useAutofillHost(serve: VaultHostServe, autoLock: AutoLock) {
    const session = useVaultSession()
    const { accounts } = useVaultAccounts()
    const { loginOf, passwordOf } = useAccountCredentials()
    const codeAt = useGuardCodes()
    const failed = (error: unknown) => reportError(error, 'autofill')

    const unlocked = () => session.state === 'unlocked'
    async function state(tab: number): Promise<StateAnswer> {
        if (!unlocked()) return { state: session.state, accounts: [] }
        const rows = accounts.value.map(pickerOf)
        const last = await sessionBound
            .read(tabFillKey(tab))
            .catch(() => undefined)
        const guardFor = rows.some(({ id }) => id === last)
            ? last
            : rows.find(({ guard }) => guard)?.id
        return {
            state: 'unlocked',
            accounts: rows,
            ...(guardFor && { guardFor }),
        }
    }

    /** The account to fill, or why not. */
    function fillable(id: string): Account | Refused {
        if (!unlocked()) return { refused: 'locked' }
        const account = accounts.value.find((found) => found.id === id)
        if (!account) return { refused: 'gone' }
        return ownPassword(account) ? { refused: 'account-locked' } : account
    }

    // Handing out a secret is activity, and what a Guard prompt on this tab follows.
    async function handedOut(tab: number, id?: string) {
        await Promise.all([
            id === undefined
                ? undefined
                : sessionBound.write(tabFillKey(tab), id).catch(failed),
            autoLock.touch(),
        ])
    }

    async function login(id: string, tab: number): Promise<LoginAnswer> {
        const account = fillable(id)
        if ('refused' in account) return account
        try {
            const answer = {
                login: await loginOf(account),
                password: await passwordOf(account),
            }
            await handedOut(tab, id)
            // A lock while the secret opened: nothing goes out.
            return unlocked() ? answer : { refused: 'locked' }
        } catch (error) {
            // A lock while the secret opened is no failure.
            if (!unlocked()) return { refused: 'locked' }
            failed(error)
            return { refused: 'gone' }
        }
    }

    async function code(id: string, tab: number): Promise<CodeAnswer> {
        const account = fillable(id)
        if ('refused' in account) return account
        // The vault gives a stand-in code to an account with no authenticator.
        if (!account.guard) return { refused: 'gone' }
        try {
            const answer = { code: await codeAt(id) }
            await handedOut(tab)
            return unlocked() ? answer : { refused: 'locked' }
        } catch (error) {
            // A lock while the secret opened is no failure.
            if (!unlocked()) return { refused: 'locked' }
            failed(error)
            return { refused: 'gone' }
        }
    }

    async function answer(message: unknown, tab: number): Promise<unknown> {
        const request = parseRequest(message)
        if (!request) return undefined
        await session.load()
        await autoLock.check()
        await session.refreshOpen()
        switch (request.type) {
            case 'autofill:state':
                return state(tab)
            case 'autofill:login':
                return login(request.id, tab)
            case 'autofill:code':
                return code(request.id, tab)
            case 'autofill:filled':
                // An own-password account counts: its Guard prompt then names it, and says to fill from the toolbar.
                if (accounts.value.some(({ id }) => id === request.id))
                    await sessionBound
                        .write(tabFillKey(tab), request.id)
                        .catch(failed)
                return {}
        }
    }

    onScopeDispose(serve(answer))
}
