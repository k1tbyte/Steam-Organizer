import type { AccountSecret } from '@so/core'

import { usePlatform } from '#core'
import { useVaultSession } from '#features/vault'

import {
    demoGuardCode,
    guardPhase,
    steamGuardCode,
} from '../services/guardCode'
import { steamNow, syncSteamClock } from '../services/steamClock'

/** Codes from the authenticator the vault keeps for an account; an id it does not hold (a sample) gets the demo code.
 *  The secret opens per call: nothing decrypted stays in memory. */
export function useGuardCodes() {
    const session = useVaultSession()
    const { fetch } = usePlatform()
    // Read at mount, so a first code seldom waits for it.
    void syncSteamClock(fetch)
    // Defaults to this instant, once Steam's clock is read: a ticking clock can lag a rollover, so a copy or a fill
    // never reads one, and a popup copies right after it opens.
    return async (id: string, nowMs?: number) => {
        await syncSteamClock(fetch)
        const { period } = guardPhase(nowMs ?? steamNow())
        const secret = await session.secretOf<AccountSecret>(id)
        const shared = secret?.authenticator?.sharedSecret
        return shared
            ? steamGuardCode(shared, period)
            : demoGuardCode(id, period)
    }
}
