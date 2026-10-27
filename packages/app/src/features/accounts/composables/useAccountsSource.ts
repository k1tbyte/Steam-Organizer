import { computed } from 'vue'

import { useMock } from '#core'
import { useVaultSession } from '#features/vault'

import { type AccountsSample, accountsMock } from '../mocks'
import type { Account } from '../model'
import { accountsIn, tagsIn } from '../services/vaultAccounts'

/** The open vault's accounts and tags, or a sample over them; writes reach the vault only `onVault`. */
export function useAccountsSource() {
    const session = useVaultSession()
    const real = computed<AccountsSample | undefined>(() => {
        if (!session.contents) return undefined
        const accounts = accountsIn(session.contents.data)
        const opened = (account: Account) =>
            account.locked && session.keyOf(account.id) !== undefined
        return {
            accounts: accounts.some(opened)
                ? accounts.map((account) =>
                      opened(account) ? { ...account, locked: false } : account,
                  )
                : accounts,
            tags: tagsIn(session.contents.data),
        }
    })
    const sample = useMock(() => real.value, accountsMock)
    // Mock mode shows a sample over an open vault: its pins and moves stay in the view store.
    const onVault = computed(
        () => real.value !== undefined && sample.value === real.value,
    )
    return { session, sample, onVault }
}
