import type { Account } from '#features/accounts'

import type { ProfileData } from '../model'

const DAY_MS = 86_400_000

/** A vault account's profile from its last refresh; credentials and the revocation code come from its secret. */
export function vaultProfile({ steam, lock }: Account): ProfileData {
    const lastBanDays = steam?.bans.lastBanDays ?? null
    return {
        visibility: steam?.visibility ?? null,
        registered: steam?.registeredAt ?? null,
        vanity: steam?.vanity ?? null,
        stats: null,
        banDetails: {},
        lastBanAt:
            steam && lastBanDays !== null
                ? steam.refreshedAt - lastBanDays * DAY_MS
                : null,
        lock: lock ?? null,
        credentials: { steam: [], linked: [] },
        revocationCode: null,
    }
}
