import type { SteamSnapshot } from '@so/core'
import { expect, it } from 'vitest'

import type { Account } from '#features/accounts'

import { vaultProfile } from './vaultProfile'

const DAY_MS = 86_400_000
const steam: SteamSnapshot = {
    refreshedAt: 100 * DAY_MS,
    nickname: 'kyzz',
    avatar: '',
    level: 12,
    registeredAt: 10 * DAY_MS,
    visibility: 'friends',
    vanity: 'kyzzdef',
    bans: {
        vac: 1,
        game: 0,
        community: false,
        economy: 'none',
        lastBanDays: 30,
    },
    stats: null,
}

it('reads the profile from the last refresh, the latest ban counted from it', () => {
    expect(vaultProfile({ steam } as Account)).toMatchObject({
        visibility: 'friends',
        registered: 10 * DAY_MS,
        vanity: 'kyzzdef',
        lastBanAt: 70 * DAY_MS,
        lock: null,
    })
})

it('knows nothing of Steam before the first refresh', () => {
    expect(vaultProfile({} as Account)).toMatchObject({
        visibility: null,
        registered: null,
        stats: null,
        lastBanAt: null,
    })
})
