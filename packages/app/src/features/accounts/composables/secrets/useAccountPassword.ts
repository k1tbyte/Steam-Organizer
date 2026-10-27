import type { AccountSecret } from '@so/core'

import { useVaultSession } from '#features/vault'

import { DEMO_STEAM_PASSWORD } from '../../mocks'
import type { Account } from '../../model'

/** The Steam password a copy or a fill takes from the vault: the one place the card menu, the popup and the injected UI read it.
 *  A sample has the demo value. */
export function useAccountPassword() {
    const session = useVaultSession()
    return async (account: Account) =>
        (await session.secretOf<AccountSecret>(account.id))?.password ??
        DEMO_STEAM_PASSWORD
}
