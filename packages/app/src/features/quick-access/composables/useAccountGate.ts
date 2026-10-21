import { computed, reactive, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import type { Account } from '#features/accounts'

import { DEMO_ACCOUNT_PASSWORD } from '../mocks'

/** A locked account asks its own password before anything secret leaves the popup; one unlock lasts until the popup closes. */
export function useAccountGate() {
    const { t } = useI18n()
    const unlocked = reactive(new Set<string>())
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
        submit() {
            const pending = asking.value
            if (!pending || password.value === '') return
            if (password.value !== DEMO_ACCOUNT_PASSWORD) {
                error.value = t('Wrong password')
                return
            }
            unlocked.add(pending.account.id)
            asking.value = undefined
            pending.proceed()
        },
        cancel() {
            asking.value = undefined
        },
    }
}
