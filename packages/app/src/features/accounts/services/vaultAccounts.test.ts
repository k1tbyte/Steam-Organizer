import { type AccountData, RECORD, readAccount } from '@so/core'
import { describe, expect, it } from 'vitest'

import { accountsIn, placedKeys, storedAccounts } from './vaultAccounts'

const account = (fields: Partial<AccountData>) =>
    readAccount({ kind: RECORD.ACCOUNT, ...fields }) as AccountData

describe('accountsIn', () => {
    it('lists accounts in the vault order with their tags, skipping other records', () => {
        const data = new Map<string, unknown>([
            ['b', account({ order: 'a1', login: 'second', tags: ['t'] })],
            ['t', { kind: RECORD.TAG, label: 'farm', hue: 120 }],
            ['a', account({ order: 'a0', login: 'first', alias: 'Main' })],
        ])
        const [first, second] = accountsIn(data)
        expect(first).toMatchObject({ id: 'a', nickname: 'Main', tags: [] })
        expect(second).toMatchObject({
            id: 'b',
            nickname: 'second',
            tags: [{ label: 'farm', hue: 120 }],
            anonymous: true,
        })
    })

    it('shows the Steam side: account ID, nickname under the alias, bans', () => {
        const [shown] = accountsIn(
            new Map([
                [
                    'a',
                    account({
                        steamId: '76561199044795099',
                        steam: {
                            refreshedAt: 0,
                            nickname: 'Nova',
                            avatar: '',
                            level: 12,
                            registeredAt: null,
                            visibility: 'public',
                            vanity: null,
                            bans: {
                                vac: 1,
                                game: 0,
                                community: false,
                                economy: 'probation',
                                lastBanDays: 3,
                            },
                            stats: null,
                        },
                    }),
                ],
            ]),
        )
        expect(shown).toMatchObject({
            nickname: 'Nova',
            steamId: '1084529371',
            level: 12,
            bans: ['vac', 'economy'],
        })
    })
})

describe('placedKeys', () => {
    // h* are hidden by a filter: the moved accounts land between shown neighbours and skip past none of them.
    const stored = storedAccounts(
        new Map(
            ['a0', 'h0', 'a1', 'h1', 'a2'].map((id, index) => [
                id,
                account({ order: `a${index}` }),
            ]),
        ),
    )
    const orderAfter = (keys: Map<string, string>) =>
        stored
            .map(({ id, data }) => ({ id, order: keys.get(id) ?? data.order }))
            .sort((a, b) => (a.order < b.order ? -1 : 1))
            .map(({ id }) => id)

    it('keys the moved accounts right after their neighbour, before any hidden one', () => {
        const keys = placedKeys(stored, {
            ids: ['a2', 'a0'],
            after: 'a1',
            before: null,
        })
        expect([...keys.keys()]).toEqual(['a2', 'a0'])
        expect(orderAfter(keys)).toEqual(['h0', 'a1', 'a2', 'a0', 'h1'])
    })

    it('moves nothing when the neighbour is gone', () => {
        expect(
            placedKeys(stored, { ids: ['a0'], after: 'x', before: null }).size,
        ).toBe(0)
    })
})
