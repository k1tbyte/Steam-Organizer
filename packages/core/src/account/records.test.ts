import { expect, it } from 'vitest'

import {
    createVault,
    loginTag,
    openData,
    openSecret,
    orderKeys,
    RECORD,
    readAccount,
    readTag,
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
