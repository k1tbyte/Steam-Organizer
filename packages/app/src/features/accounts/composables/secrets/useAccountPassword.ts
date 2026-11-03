import type { AccountSecret } from '@so/core'

import { mocksOn } from '#core'
import { useVaultSession } from '#features/vault'

import { DEMO_STEAM_PASSWORD } from '../../mocks'
import type { Account } from '../../model'

/** The Steam password a copy or a fill takes from the vault: the one place the card menu, the popup and the injected UI read it.
 *  Rejects when the vault can't give it, so nothing is copied or filled; a sample has the demo value. */
export function useAccountPassword() {
    const session = useVaultSession()
    return async (account: Account) => {
        const password = (await session.secretOf<AccountSecret>(account.id))
            ?.password
        if (password !== undefined) return password
        if (mocksOn() && !session.contents?.data.has(account.id))
            return DEMO_STEAM_PASSWORD
        throw new Error('The account password is out of reach')
    }
}
