import type { Account } from '#features/accounts'

import { DEMO_STEAM_PASSWORD } from '../mocks'

/** The Steam password a copy or a fill takes from the vault: the one place the popup and the injected UI read it. */
export function useAccountPassword() {
    // Waits on the vault: nothing is decrypted yet, so every account has the demo value.
    return (_account: Account) => DEMO_STEAM_PASSWORD
}
