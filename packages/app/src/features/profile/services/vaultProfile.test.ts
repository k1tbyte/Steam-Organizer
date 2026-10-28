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
    badge: '1+',
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
    stats: {
        games: 3,
        played: 2,
        hours: 12,
        paid: 1,
        value: 9.99,
        currency: 'EUR',
        friends: null,
    },
}

it('reads the profile from the last refresh, the latest ban counted from it', () => {
    expect(vaultProfile({ steam, years: 0.2 } as Account)).toMatchObject({
        stats: { games: 3, currency: 'EUR', years: 0.2, badge: '1+' },
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
