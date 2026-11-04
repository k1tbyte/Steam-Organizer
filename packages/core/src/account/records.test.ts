import { describe, expect, it } from 'vitest'

import {
    createVault,
    loginTag,
    openData,
    openSecret,
    orderKeys,
    RECORD,
    readAccount,
    readPreset,
    readTag,
    rekeyTies,
    sealRecord,
    updateData,
} from '../index'

const { key } = await createVault('pw')

it('tags a login the same way whatever its case and outer spaces, per vault', async () => {
    const tag = await loginTag(key, 'Nova_Owl')
    expect(await loginTag(key, '  nova_owl ')).toBe(tag)
    expect(await loginTag(key, 'nova_owl0')).not.toBe(tag)
    expect(Uint8Array.fromBase64(tag)).toHaveLength(16)

    const other = await createVault('pw')
    expect(await loginTag(other.key, 'nova_owl')).not.toBe(tag)
})

it('reseals the data part and keeps the sealed secret as it was', async () => {
    const record = await sealRecord(key, {
        id: 'a',
        updatedAt: 1,
        data: { pinned: false },
        secret: { password: 'hunter2' },
    })
    const updated = await updateData(key, record, { pinned: true }, 2)
    expect(updated.secret).toBe(record.secret)
    expect(updated.updatedAt).toBe(2)
    expect(await openData(key, updated)).toEqual({ pinned: true })
    expect(await openSecret(key, updated)).toEqual({ password: 'hunter2' })
})

it('reads a record of its kind with defaults for the fields it lacks', () => {
    expect(readAccount({ kind: RECORD.TAG, label: 'x' })).toBeNull()
    expect(readAccount({ kind: RECORD.ACCOUNT, alias: 'Main' })).toMatchObject({
        alias: 'Main',
        tags: [],
        pinned: false,
        steam: null,
    })
    expect(readTag({ kind: RECORD.TAG, label: 'farm' })).toEqual({
        kind: RECORD.TAG,
        label: 'farm',
        hue: 0,
    })
    expect(readPreset({ kind: RECORD.SERVICE, name: 'x' })).toBeNull()
    expect(readPreset({ kind: RECORD.PRESET })).toEqual({
        kind: RECORD.PRESET,
        name: '',
        look: {},
    })
})

it('places keys between neighbours, past either end and in order', () => {
    const [first, last] = orderKeys(null, null, 2) as [string, string]
    const between = orderKeys(first, last, 3)
    expect([first, ...between, last]).toEqual(
        [first, ...between, last].toSorted(),
    )
    const [before] = orderKeys(null, first, 1) as [string]
    const [after] = orderKeys(last, null, 1) as [string]
    expect(before < first && after > last).toBe(true)
})

describe('rekeyTies', () => {
    const accounts = (...entries: [string, string][]) =>
        entries.map(([id, order]) => ({ id, order }))
    const byOrder = (list: { id: string; order: string }[]) =>
        list
            .toSorted(
                (a, b) =>
                    (a.order < b.order ? -1 : a.order > b.order ? 1 : 0) ||
                    (a.id < b.id ? -1 : 1),
            )
            .map(({ id }) => id)
    /** The accounts with the new keys applied, as the merge reseals them. */
    const rekeyed = (list: { id: string; order: string }[]) => {
        const keys = rekeyTies(list)
        return list.map(({ id, order }) => ({
            id,
            order: keys.get(id) ?? order,
        }))
    }

    it('changes nothing without ties', () => {
        expect(rekeyTies([])).toEqual(new Map())
        expect(
            rekeyTies(accounts(['a', 'a0'], ['b', 'a1'], ['c', 'a2'])),
        ).toEqual(new Map())
    })

    it('keeps the first of a run by id and rekeys the rest between it and the next key', () => {
        const list = accounts(
            ['c', 'a1'],
            ['a', 'a1'],
            ['d', 'a2'],
            ['b', 'a1'],
        )
        const keys = rekeyTies(list)
        expect([...keys.keys()].sort()).toEqual(['b', 'c'])
        const [first, second] = [keys.get('b'), keys.get('c')] as [
            string,
            string,
        ]
        expect('a1' < first && first < second && second < 'a2').toBe(true)
        expect(byOrder(rekeyed(list))).toEqual(['a', 'b', 'c', 'd'])
    })

    it('rekeys several runs, one at the start, one at the end', () => {
        const list = accounts(
            ['a', 'a0'],
            ['b', 'a0'],
            ['c', 'a1'],
            ['d', 'a2'],
            ['e', 'a2'],
            ['f', 'a2'],
        )
        const before = byOrder(list)
        const keys = rekeyTies(list)
        expect([...keys.keys()].sort()).toEqual(['b', 'e', 'f'])
        const next = rekeyed(list)
        expect(byOrder(next)).toEqual(before)
        expect(new Set(next.map(({ order }) => order)).size).toBe(list.length)
        expect((keys.get('e') as string) > 'a2').toBe(true)
        expect((keys.get('b') as string) < 'a1').toBe(true)
    })

    it('gives every device holding the same accounts the same keys', () => {
        const list = accounts(
            ['x', 'a1'],
            ['m', 'a1'],
            ['q', 'a1'],
            ['k', 'a0'],
            ['z', 'a0'],
        )
        expect(rekeyTies(list.toReversed())).toEqual(rekeyTies(list))
        expect(rekeyTies(rekeyed(list))).toEqual(new Map())
    })
})
