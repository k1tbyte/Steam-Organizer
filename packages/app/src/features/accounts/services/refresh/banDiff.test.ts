import type { SteamBans } from '@so/core'
import { expect, it } from 'vitest'

import { newBans } from './banDiff'

const CLEAN: SteamBans = {
    vac: 0,
    game: 0,
    community: false,
    economy: 'none',
    lastBanDays: null,
}

it('finds nothing when the bans stayed as they were', () => {
    expect(newBans(CLEAN, CLEAN)).toEqual([])
    const banned: SteamBans = { ...CLEAN, vac: 1, community: true }
    expect(newBans(banned, { ...banned, lastBanDays: 40 })).toEqual([])
})

it('names each kind that is new, in the list order', () => {
    expect(
        newBans(CLEAN, {
            vac: 1,
            game: 2,
            community: true,
            economy: 'banned',
            lastBanDays: 0,
        }),
    ).toEqual(['vac', 'game', 'community', 'economy'])
})

it('counts a ban count that grew as a new ban', () => {
    const before: SteamBans = { ...CLEAN, vac: 1, game: 1, lastBanDays: 300 }
    expect(newBans(before, { ...before, vac: 2, lastBanDays: 0 })).toEqual([
        'vac',
    ])
    expect(newBans(before, { ...before, game: 3 })).toEqual(['game'])
})

it('takes a trade probation, and a probation turned ban, as new; a lifted one as nothing', () => {
    expect(newBans(CLEAN, { ...CLEAN, economy: 'probation' })).toEqual([
        'economy',
    ])
    const probation: SteamBans = { ...CLEAN, economy: 'probation' }
    expect(newBans(probation, { ...CLEAN, economy: 'banned' })).toEqual([
        'economy',
    ])
    expect(newBans({ ...CLEAN, economy: 'banned' }, probation)).toEqual([])
    expect(newBans({ ...CLEAN, community: true }, CLEAN)).toEqual([])
})

it('finds nothing without an earlier snapshot to compare', () => {
    const banned: SteamBans = { ...CLEAN, vac: 2, community: true }
    expect(newBans(null, banned)).toEqual([])
    expect(newBans(undefined, banned)).toEqual([])
})
