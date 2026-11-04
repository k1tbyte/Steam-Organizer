import { readV2Export } from '@so/core'
import { expect, it } from 'vitest'

import { fitsLogin, readMaFile } from '../../../steam-guard/services/maFile'
import { legacyAccounts } from './legacyAccounts'

const rules = { read: readMaFile, fits: fitsLogin }
const NOW = Date.parse('2026-01-01T00:00:00.000Z')

const mapped = (accounts: unknown[]) =>
    legacyAccounts(readV2Export(JSON.stringify(accounts)) ?? [], rules, NOW)

it('keeps an authenticator only with a shared_secret and for this login', () => {
    const [kept, noSecret, another] = mapped(
        ['a', 'b', 'c'].map((login, index) => ({
            login,
            password: 'pw',
            authenticator: [
                { shared_secret: 'c2VjcmV0', account_name: 'A' },
                { identity_secret: 'x', account_name: 'b' },
                { shared_secret: 'c2VjcmV0', account_name: 'someone' },
            ][index],
        })),
    )
    expect(kept?.authenticator?.sharedSecret).toBe('c2VjcmV0')
    expect(noSecret?.authenticator).toBeUndefined()
    expect(another?.authenticator).toBeUndefined()
})

it('names linked logins: built-in by icon, the old names for the rest, a custom name, else Other', () => {
    const [account] = mapped([
        {
            login: 'a',
            password: 'pw',
            credentials: [
                { i: 53, n: 'My EA', f: { 0: 'ea' } },
                { i: 59, f: { 0: 'wg' } },
                { i: 12, n: 'Origin', f: { 0: 'or' } },
                { f: { 3: 'word' } },
                { i: 51, f: { 1: 'a@b.c', 2: 'mail-pw' } },
                { i: 54, f: { 0: '' } },
            ],
        },
    ])
    expect(account?.email).toBe('a@b.c')
    expect(account?.services).toEqual([
        { service: { name: 'EA' }, fields: [{ kind: 'login', value: 'ea' }] },
        {
            service: { name: 'Wargaming' },
            fields: [{ kind: 'login', value: 'wg' }],
        },
        {
            service: { name: 'Origin' },
            fields: [{ kind: 'login', value: 'or' }],
        },
        {
            service: { name: 'Other' },
            fields: [{ kind: 'secret-word', value: 'word' }],
        },
        {
            service: { name: 'Email' },
            fields: [{ kind: 'password', value: 'mail-pw' }],
        },
    ])
})

it('keeps a Steam profile only with its face, and drops what never maps', () => {
    const [face, faceless] = mapped([
        {
            login: 'a',
            password: 'pw',
            nickname: 'persona',
            id: 1000,
            avatarHash: 'abc',
            visibilityState: 2,
            vacBansCount: 1,
            daysSinceLastBan: 40,
            economyBan: 1,
            gamesCount: 300,
            totalGamesPrice: '$1,234.00',
            gamesBadgeBoundary: 250,
            lastUpdateDate: '2025-01-01T00:00:00.000Z',
            vanityUrl: 'persona_url',
        },
        { login: 'b', password: 'pw', nickname: 'b', id: 1001 },
    ])
    expect(face?.steam).toEqual({
        refreshedAt: Date.parse('2025-01-01T00:00:00.000Z'),
        nickname: 'persona',
        avatar: 'abc',
        level: 0,
        badge: '',
        registeredAt: null,
        visibility: 'friends',
        vanity: 'persona_url',
        bans: {
            vac: 1,
            game: 0,
            community: false,
            economy: 'probation',
            lastBanDays: 40,
        },
        stats: null,
    })
    expect(faceless).toMatchObject({
        steamId: '76561197960266729',
        addedAt: NOW,
    })
    expect(faceless?.steam).toBeUndefined()
    expect(faceless?.alias).toBeUndefined()
})
