import type { AccountSecret } from '@so/core'

import { useVaultSession } from '#features/vault'

import {
    demoGuardCode,
    guardPhase,
    steamGuardCode,
} from '../services/guardCode'

/** Codes from the authenticator the vault keeps for an account; an id it does not hold (a sample) gets the demo code.
 *  The secret opens per call: nothing decrypted stays in memory. */
export function useGuardCodes() {
    const session = useVaultSession()
    // Defaults to the real time: a ticking clock can lag a rollover, so a copy or a fill never reads one.
    return async (id: string, nowMs = Date.now()) => {
        const { period } = guardPhase(nowMs)
        const secret = await session.secretOf<AccountSecret>(id)
        const shared = secret?.authenticator?.sharedSecret
        return shared
            ? steamGuardCode(shared, period)
            : demoGuardCode(id, period)
    }
}
