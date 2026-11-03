import { computed, reactive, shallowRef, watch } from 'vue'

import { mocksOn } from '#core'
import {
    type Account,
    useAccountLocks,
    useUnlockForm,
} from '#features/accounts'
import { useVaultSession } from '#features/vault'

import { DEMO_ACCOUNT_PASSWORD } from '../mocks'

/** A locked account asks its own password before anything secret leaves the popup; one unlock lasts until the popup closes.
 *  A sample opens with the demo password. */
export function usePopupAccountGate() {
    const session = useVaultSession()
    const locks = useAccountLocks()
    // Samples only: a vault account shows unlocked once the session holds its key.
    const unlocked = reactive(new Set<string>())
    const asking = shallowRef<{ account: Account; proceed: () => void }>()
    const form = useUnlockForm(
        () => asking.value?.account.lock,
        (credential) => {
            const id = asking.value?.account.id
            if (id && session.contents?.data.has(id))
                return locks.unlock(id, credential)
            return Promise.resolve(
                mocksOn() &&
                    'password' in credential &&
                    credential.password === DEMO_ACCOUNT_PASSWORD,
            )
        },
    )

    watch(form.password, form.clearError)

    return {
        asking: computed(() => asking.value?.account),
        password: form.password,
        error: form.error,
        /** Locked and not yet unlocked: its login and code stay masked. */
        isConcealed: (account: Account) =>
            account.locked && !unlocked.has(account.id),
        /** Runs `proceed` now, or after the account's password when it is locked. */
        guard(account: Account, proceed: () => void) {
            if (!account.locked || unlocked.has(account.id)) return proceed()
            form.reset()
            asking.value = { account, proceed }
        },
        async submit() {
            const pending = asking.value
            if (!pending || !(await form.submit())) return
            // Closed while it was checked: nothing runs.
            if (asking.value !== pending) return
            unlocked.add(pending.account.id)
            asking.value = undefined
            pending.proceed()
        },
        cancel() {
            asking.value = undefined
        },
    }
}
