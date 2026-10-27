import { computed, reactive, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { type Account, useAccountLocks } from '#features/accounts'
import { useVaultSession } from '#features/vault'

import { DEMO_ACCOUNT_PASSWORD } from '../mocks'

/** A locked account asks its own password before anything secret leaves the popup; one unlock lasts until the popup closes.
 *  A sample opens with the demo password. */
export function useAccountGate() {
    const { t } = useI18n()
    const session = useVaultSession()
    const locks = useAccountLocks()
    // Samples only: a vault account shows unlocked once the session holds its key.
    const unlocked = reactive(new Set<string>())
    let busy = false
    const asking = shallowRef<{ account: Account; proceed: () => void }>()
    const password = ref('')
    const error = ref('')

    watch(password, () => {
        error.value = ''
    })

    return {
        asking: computed(() => asking.value?.account),
        password,
        error,
        /** Locked and not yet unlocked: its login and code stay masked. */
        isConcealed: (account: Account) =>
            account.locked && !unlocked.has(account.id),
        /** Runs `proceed` now, or after the account's password when it is locked. */
        guard(account: Account, proceed: () => void) {
            if (!account.locked || unlocked.has(account.id)) return proceed()
            password.value = ''
            error.value = ''
            asking.value = { account, proceed }
        },
        async submit() {
            const pending = asking.value
            const entered = password.value
            if (!pending || entered === '' || busy) return
            const { id } = pending.account
            busy = true
            let accepted: boolean
            try {
                accepted = session.contents?.data.has(id)
                    ? await locks.unlock(id, { password: entered })
                    : entered === DEMO_ACCOUNT_PASSWORD
            } finally {
                busy = false
            }
            if (asking.value !== pending) return
            if (!accepted) {
                error.value = t('Wrong password')
                return
            }
            unlocked.add(id)
            asking.value = undefined
            pending.proceed()
        },
        cancel() {
            asking.value = undefined
        },
    }
}
