import { type InjectionKey, inject, provide, shallowRef } from 'vue'

import { reportError, usePlatform } from '#core'
import type { PickerAccount } from '#features/quick-access'

import type {
    AutofillRequest,
    AutofillState,
    CodeAnswer,
    LoginAnswer,
} from '../model'
import { readCode, readLogin, readState } from '../services/messages'

type Host = { request(message: unknown): Promise<unknown> } | undefined

/** The content script's whole view of the vault: the host's answers. The key and the records stay in the host; a
 *  password or a code is the answer to one fill and never sits in a ref here. */
export function createAutofillVault(host: Host) {
    // Unknown until the first answer.
    const state = shallowRef<AutofillState>()
    const accounts = shallowRef<PickerAccount[]>([])
    const guardFor = shallowRef<string>()
    // Each refresh and each cancel moves it: an answer that finds it moved is stale.
    let turn = 0

    async function ask(message: AutofillRequest): Promise<unknown> {
        try {
            return await host?.request(message)
        } catch (error) {
            reportError(error, 'autofill')
            return undefined
        }
    }

    /** Reads the host's list again. Out of reach reads as locked: the notice sends the user to the extension. */
    async function refresh() {
        const mine = ++turn
        const answer = readState(await ask({ type: 'autofill:state' }))
        if (mine !== turn) return
        state.value = answer?.state ?? 'locked'
        accounts.value = answer?.accounts ?? []
        guardFor.value = answer?.guardFor
    }

    /** Drops what is in flight: the picker closed or the page asks something else now. */
    function cancel() {
        turn++
    }

    // A refusal means the list on show is out of date: look again before the caller reports it.
    async function refused<T extends LoginAnswer | CodeAnswer>(answer: T) {
        if ('refused' in answer) await refresh()
        return answer
    }

    return {
        state,
        accounts,
        guardFor,
        refresh,
        cancel,
        /** The login and password of one account, or the refusal. `current` says whether the fill is still wanted once
         *  the answer is in; when not, `undefined`, and nothing of the answer leaves this call. */
        async login(
            id: string,
            current: () => boolean = () => true,
        ): Promise<LoginAnswer | undefined> {
            const answer =
                readLogin(await ask({ type: 'autofill:login', id })) ??
                ({ refused: 'locked' } as const)
            return current() ? refused(answer) : undefined
        },
        /** The Guard code of one account, or the refusal; `current` as for `login`. */
        async code(
            id: string,
            current: () => boolean = () => true,
        ): Promise<CodeAnswer | undefined> {
            const answer =
                readCode(await ask({ type: 'autofill:code', id })) ??
                ({ refused: 'locked' } as const)
            return current() ? refused(answer) : undefined
        },
        /** Tells the host the popup filled this account on this tab. */
        async filled(id: string) {
            await ask({ type: 'autofill:filled', id })
        },
    }
}

export type AutofillVault = ReturnType<typeof createAutofillVault>

const VAULT: InjectionKey<AutofillVault> = Symbol('autofill-vault')

/** The root creates the one vault view over `Platform.vaultHost` and shares it with the parts below it. */
export function provideAutofillVault(): AutofillVault {
    const vault = createAutofillVault(usePlatform().vaultHost)
    provide(VAULT, vault)
    return vault
}

export function useAutofillVault(): AutofillVault {
    const vault = inject(VAULT)
    if (!vault) throw new Error('The autofill vault is not provided')
    return vault
}
