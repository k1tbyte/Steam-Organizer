import { RECORD, type SealedRecord, TOMBSTONE_TTL_MS } from '@so/core'
import { expect, it } from 'vitest'

import { picturePlan, pictureStatus } from './pictureSync'

const NOW = 10 * TOMBSTONE_TTL_MS
const file = (id: string, presetId: string, imageId: string, age = 0) => ({
    id,
    vaultId: 'v1',
    presetId,
    imageId,
    modifiedAt: NOW - age,
})
const preset = (image?: string) => ({
    kind: RECORD.PRESET,
    name: 'Look',
    look: {},
    ...(image && { image: { id: image, colors: '' } }),
})
const live = (id: string) => ({ id, updatedAt: 1 }) as SealedRecord
const deleted = (id: string, age: number) =>
    ({ id, updatedAt: NOW - age, deleted: true }) as SealedRecord

it('uploads a picture this device holds over the preset file, never one it lacks', () => {
    const data = new Map([
        ['p1', preset('i2')],
        ['p2', preset('i3')],
        ['p3', preset('i4')],
        ['p4', preset('i5')],
    ])
    const files = [file('f1', 'p1', 'i1'), file('f2', 'p2', 'i3')]
    const plan = picturePlan(
        files,
        [...data.keys()].map(live),
        data,
        new Set(['i2', 'i3', 'i4']),
        NOW,
    )
    expect(plan.upload).toEqual([
        { presetId: 'p1', imageId: 'i2', fileId: 'f1' },
        { presetId: 'p3', imageId: 'i4', fileId: undefined },
    ])
    expect(plan.remove).toEqual([])
})

it('keeps one file per preset, the one with its picture', () => {
    const data = new Map([['p1', preset('i2')]])
    const files = [
        file('f1', 'p1', 'i1'),
        file('f2', 'p1', 'i2'),
        file('f3', 'p1', 'i2'),
    ]
    const plan = picturePlan(files, [live('p1')], data, new Set(), NOW)
    expect(plan).toEqual({ upload: [], remove: ['f1', 'f3'] })
})

it('drops a file once nothing can bring its preset back', () => {
    const data = new Map([['p1', preset()]])
    const files = [
        file('f1', 'p1', 'i1'),
        file('f2', 'gone', 'i2'),
        file('f3', 'old', 'i3'),
        file('f4', 'unknown', 'i4', TOMBSTONE_TTL_MS - 1),
        file('f5', 'stale', 'i5', TOMBSTONE_TTL_MS + 1),
    ]
    const records = [
        live('p1'),
        deleted('gone', TOMBSTONE_TTL_MS - 1),
        deleted('old', TOMBSTONE_TTL_MS + 1),
    ]
    const plan = picturePlan(files, records, data, new Set(), NOW)
    expect(plan.remove.toSorted()).toEqual(['f1', 'f3', 'f5'])
})

it('keeps the last copy of a picture another preset shares', () => {
    // p2 was saved as new from p1's picture on a device without its bytes.
    const shared = picturePlan(
        [file('f1', 'p1', 'i1')],
        [live('p1'), live('p2')],
        new Map([
            ['p1', preset()],
            ['p2', preset('i1')],
        ]),
        new Set(),
        NOW,
    )
    expect(shared).toEqual({ upload: [], remove: [] })

    const replaced = picturePlan(
        [file('f1', 'p1', 'i1'), file('f2', 'p3', 'i3')],
        [live('p1'), live('p2')],
        new Map([
            ['p1', preset('i2')],
            ['p2', preset('i1')],
        ]),
        new Set(['i2']),
        NOW,
    )
    expect(replaced.upload).toEqual([
        { presetId: 'p1', imageId: 'i2', fileId: undefined },
    ])
    expect(replaced.remove).toEqual([])
})

it('says what a tile picture waits for', () => {
    const base = {
        held: true,
        loading: false,
        listed: true,
        synced: true,
        connected: true,
        followed: true,
    }
    expect(pictureStatus(base)).toBeNull()
    expect(pictureStatus({ ...base, listed: false })).toBe('waiting')
    expect(pictureStatus({ ...base, listed: false, synced: false })).toBeNull()
    expect(pictureStatus({ ...base, held: undefined })).toBeNull()
    expect(pictureStatus({ ...base, held: false, loading: true })).toBe(
        'loading',
    )
    expect(pictureStatus({ ...base, held: false, listed: false })).toBe(
        'missing',
    )
    expect(pictureStatus({ ...base, held: false, synced: false })).toBe(
        'missing',
    )
    expect(pictureStatus({ ...base, held: false, connected: false })).toBe(
        'offline',
    )
    expect(
        pictureStatus({
            ...base,
            held: false,
            connected: false,
            followed: false,
        }),
    ).toBeNull()
})
