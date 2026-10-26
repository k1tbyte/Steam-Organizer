import type { AccountSecret } from '@so/core'

import { useVaultSession } from '#features/vault'

import type { Account } from '../model'

/** The Steam login a copy or a fill takes: the searchable one, else the one the vault keeps secret. */
export function useAccountLogin() {
    const session = useVaultSession()
    return async (account: Account) =>
        account.login ||
        ((await session.secretOf<AccountSecret>(account.id))?.login ?? '')
}
