import {
    type AccountData,
    type AccountSecret,
    createVault,
    type LiveRecord,
    loginTag,
    openData,
    openSecret,
    RECORD,
    readAccount,
    sealRecord,
} from '@so/core'
import { expect, it } from 'vitest'

import { mergedImport } from './vaultMerge'

const { key } = await createVault('correct horse')

const seal = (
    id: string,
    data: unknown,
    secret?: AccountSecret,
    updatedAt = 1,
) => sealRecord(key, { id, updatedAt, data, secret })

async function account(
    id: string,
    fields: Partial<AccountData>,
    services = ['s-in'],
) {
    const data = readAccount({
        kind: RECORD.ACCOUNT,
        loginTag: await loginTag(key, id),
        ...fields,
    })
    return seal(id, data, {
        password: 'pw',
        services: services.map((service) => ({ service, fields: [] })),
    })
}

const ids = (records: readonly LiveRecord[]) =>
    records.map(({ id }) => id).sort()

const ownTag = { kind: RECORD.TAG, label: 'Trade', hue: 1 }
const ownService = { kind: RECORD.SERVICE, name: 'GOG' }
const contents = {
    records: [await seal('t-own', ownTag), await seal('s-own', ownService)],
    data: new Map<string, unknown>([
        ['t-own', ownTag],
        ['s-own', ownService],
    ]),
}
const doubles = [
    await seal('t-in', { kind: RECORD.TAG, label: ' trade', hue: 2 }),
    await seal('s-in', { kind: RECORD.SERVICE, name: 'gog' }),
]

it("moves the accounts onto the vault's own tag and service of the same name", async () => {
    const { records, imported } = await mergedImport(key, contents, [
        await account('a', { tags: ['t-in'] }),
        ...doubles,
    ])
    expect(records.map(({ id }) => id)).toEqual(['a'])
    expect(imported).toBe(1)
    const [merged] = records as [LiveRecord]
    expect(readAccount(await openData(key, merged))?.tags).toEqual(['t-own'])
    const secret = await openSecret<AccountSecret>(key, merged)
    expect(secret?.services.map(({ service }) => service)).toEqual(['s-own'])
})

it('keeps the services a locked account may name, its secret as sealed', async () => {
    const lock = { scope: 'credentials' as const, slots: {} as never }
    const locked = await account('b', { tags: ['t-in'], lock })
    const { records } = await mergedImport(key, contents, [locked, ...doubles])
    expect(ids(records)).toEqual(['b', 's-in'])
    const merged = records.find(({ id }) => id === 'b') as LiveRecord
    expect(merged.secret).toBe(locked.secret)
    expect(readAccount(await openData(key, merged))?.tags).toEqual(['t-own'])
})

it('matches names as the file leaves them, a renamed tag among them', async () => {
    const renamed = await seal(
        't-own',
        { ...ownTag, label: 'Work' },
        undefined,
        2,
    )
    const { records } = await mergedImport(key, contents, [
        await account('c', { tags: ['t-own', 't-in'] }, []),
        renamed,
        doubles[0] as LiveRecord,
    ])
    expect(ids(records)).toEqual(['c', 't-in', 't-own'])
    const merged = records.find(({ id }) => id === 'c') as LiveRecord
    expect(readAccount(await openData(key, merged))?.tags).toEqual([
        't-own',
        't-in',
    ])
})

it("keeps a service of the vault's name that an account holds beside the vault's own", async () => {
    const both = await account('d', {}, ['s-own', 's-in'])
    const { records } = await mergedImport(key, contents, [both, ...doubles])
    expect(ids(records)).toEqual(['d', 's-in'])
    const merged = records.find(({ id }) => id === 'd') as LiveRecord
    const secret = await openSecret<AccountSecret>(key, merged)
    expect(secret?.services.map(({ service }) => service)).toEqual([
        's-own',
        's-in',
    ])
})
