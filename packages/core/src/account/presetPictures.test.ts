import 'fake-indexeddb/auto'

import { expect, it } from 'vitest'

import { backgroundStore } from '../storage/backgroundStore'
import {
    createVault,
    openData,
    type SealedRecord,
    sealRecord,
} from '../vault/vault'
import { takePictures, withPictures } from './presetPictures'
import { RECORD } from './records'

const preset = (image: string) => ({
    kind: RECORD.PRESET,
    name: 'Night',
    look: { background: 'image' },
    image: { id: image, colors: 'grid' },
})

it('carries the pictures this device holds through an export and back into a cache', async () => {
    const { key } = await createVault('pw')
    const data = new Map<string, unknown>([
        ['held', preset('i1')],
        ['lacking', preset('i2')],
        ['account', { kind: RECORD.ACCOUNT, login: 'a' }],
    ])
    const records: SealedRecord[] = [
        ...(await Promise.all(
            [...data].map(([id, value], at) =>
                sealRecord(key, { id, updatedAt: at, data: value }),
            ),
        )),
        { id: 'gone', updatedAt: 9, deleted: true },
    ]
    await backgroundStore.write('i1', new Blob([new Uint8Array([1, 2, 3])]))

    const exported = await withPictures(key, records, data)
    expect(exported.carried).toBe(true)
    expect(exported.records.slice(1)).toEqual(records.slice(1))
    expect(exported.records[0]?.updatedAt).toBe(0)

    await backgroundStore.remove('i1')
    const stored = await takePictures(key, exported.records)
    expect(stored.taken).toBe(true)
    expect(stored.records.slice(1)).toEqual(records.slice(1))
    const [first] = stored.records
    if (!first || 'deleted' in first) throw new Error('no preset')
    expect(await openData(key, first)).toEqual(preset('i1'))
    const cached = await backgroundStore.read('i1')
    expect(new Uint8Array(await (cached as Blob).arrayBuffer())).toEqual(
        new Uint8Array([1, 2, 3]),
    )
    expect(await takePictures(key, records)).toEqual({ records, taken: false })
})

it('stores a preset without a picture that cannot be cached', async () => {
    const { key } = await createVault('pw')
    const broken = {
        ...preset('i9'),
        image: { id: 'i9', colors: 'grid', bytes: '!' },
    }
    const records = [
        await sealRecord(key, { id: 'p', updatedAt: 1, data: broken }),
    ]
    const stored = await takePictures(key, records)
    const [first] = stored.records
    if (!first || 'deleted' in first) throw new Error('no preset')
    expect(await openData(key, first)).toEqual(preset('i9'))
    expect(await backgroundStore.has('i9')).toBe(false)
})
