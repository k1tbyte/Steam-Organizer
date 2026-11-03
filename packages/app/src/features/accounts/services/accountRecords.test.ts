import {
    type AccountData,
    createVault,
    type LiveRecord,
    loginTag,
    openData,
    RECORD,
    readAccount,
    sealRecord,
    steamTag,
} from '@so/core'
import { describe, expect, it } from 'vitest'

import {
    newAccountRecord,
    restoredRecords,
    type TakenAccount,
} from './accountRecords'

// One vault for the suite: creating one runs 600k PBKDF2 rounds.
const { key } = await createVault('correct horse')
const NOW = 1_000

const STEAM_ID = '76561199044795099'
const nova = { login: 'nova_strike', password: 'hunter22!', steamId: null }

async function stored(id: string, fields: Partial<AccountData>) {
    const data = readAccount({
        kind: RECORD.ACCOUNT,
        loginTag: await loginTag(key, fields.login ?? id),
        ...fields,
    }) as AccountData
    const record = await sealRecord(key, {
        id,
        updatedAt: 1,
        data,
        secret: { password: 'pw', services: [] },
    })
    return { id, data, record }
}

const contentsOf = (...items: { id: string; data: AccountData }[]) => ({
    data: new Map<string, unknown>(items.map(({ id, data }) => [id, data])),
})

describe('newAccountRecord', () => {
    it('seals a new account last in the vault order', async () => {
        const first = await stored('a', { login: 'first', order: 'a5' })
        const record = await newAccountRecord(
            key,
            contentsOf(first),
            { ...nova, alias: ' Nova ', steamId: STEAM_ID },
            NOW,
        )
        expect(typeof record).toBe('object')
        const data = readAccount(
            await openData(key, record as LiveRecord),
        ) as AccountData
        expect(data).toMatchObject({
            login: 'nova_strike',
            alias: 'Nova',
            steamId: STEAM_ID,
            addedAt: NOW,
        })
        expect(data.order > 'a5').toBe(true)
    })

    it('refuses a login already in the vault, ignoring case', async () => {
        const taken = await stored('a', { login: 'Nova_Strike' })
        expect(await newAccountRecord(key, contentsOf(taken), nova, NOW)).toBe(
            'login-taken',
        )
    })

    it('refuses a Steam ID already in the vault, also behind an everything lock', async () => {
        const open = await stored('a', { login: 'one', steamId: STEAM_ID })
        const withId = { ...nova, steamId: STEAM_ID }
        expect(await newAccountRecord(key, contentsOf(open), withId, NOW)).toBe(
            'steam-taken',
        )

        const hidden = await stored('b', {
            login: 'two',
            steamId: null,
            lock: {
                scope: 'everything',
                steamTag: await steamTag(key, STEAM_ID),
            } as AccountData['lock'],
        })
        expect(
            await newAccountRecord(key, contentsOf(hidden), withId, NOW),
        ).toBe('steam-taken')
    })
})

describe('restoredRecords', () => {
    const taken = ({ record, data }: Awaited<ReturnType<typeof stored>>) =>
        ({ record, data }) satisfies TakenAccount

    it('brings back the same sealed record, newer', async () => {
        const gone = await stored('a', { login: 'gone', order: 'a1' })
        const [back] = await restoredRecords(
            key,
            contentsOf(),
            [taken(gone)],
            NOW,
        )
        expect(back).toEqual({ ...gone.record, updatedAt: NOW })
    })

    it('skips an account whose login or Steam ID came back meanwhile', async () => {
        const sameLogin = await stored('a', { login: 'nova', order: 'a1' })
        const sameSteam = await stored('b', {
            login: 'other',
            steamId: STEAM_ID,
            order: 'a2',
        })
        const free = await stored('c', { login: 'free', order: 'a3' })
        const meanwhile = [
            await stored('x', { login: 'NOVA', order: 'b1' }),
            await stored('y', {
                login: 'third',
                steamId: STEAM_ID,
                order: 'b2',
            }),
        ]
        const back = await restoredRecords(
            key,
            contentsOf(...meanwhile),
            [sameLogin, sameSteam, free].map(taken),
            NOW,
        )
        expect(back.map(({ id }) => id)).toEqual(['c'])
    })

    it('puts an account whose order key an add took meanwhile last', async () => {
        const gone = await stored('a', { login: 'gone', order: 'a0' })
        const added = await stored('b', { login: 'added', order: 'a0' })
        const [back] = await restoredRecords(
            key,
            contentsOf(added),
            [taken(gone)],
            NOW,
        )
        const data = readAccount(
            await openData(key, back as LiveRecord),
        ) as AccountData
        expect(data.order > 'a0').toBe(true)
        expect(data.editedAt).toBe(NOW)
        expect(back?.secret).toBe(gone.record.secret)
    })
})
