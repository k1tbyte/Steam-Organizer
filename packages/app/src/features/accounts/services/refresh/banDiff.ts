import type { SteamBans } from '@so/core'

import type { BanKind } from '../../model'

// A probation that turns into a ban is news too.
const ECONOMY_RANK = { none: 0, probation: 1, banned: 2 } as const

/** The bans `after` has that `before` did not: a count that grew or a flag that turned on. With no earlier
 *  snapshot there is nothing to compare, so nothing is new. */
export function newBans(
    before: SteamBans | null | undefined,
    after: SteamBans,
): BanKind[] {
    if (!before) return []
    const grew: [BanKind, boolean][] = [
        ['vac', after.vac > before.vac],
        ['game', after.game > before.game],
        ['community', after.community && !before.community],
        ['economy', ECONOMY_RANK[after.economy] > ECONOMY_RANK[before.economy]],
    ]
    return grew.flatMap(([kind, isNew]) => (isNew ? [kind] : []))
}
