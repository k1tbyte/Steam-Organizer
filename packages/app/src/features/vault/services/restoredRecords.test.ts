import type { SealedRecord } from '@so/core'
import { expect, it } from 'vitest'

import { restoredRecords } from './restoredRecords'

const live = (id: string, updatedAt: number, data = `${id}@${updatedAt}`) => ({
    id,
    updatedAt,
    data,
})
const gone = (id: string, updatedAt: number) => ({
    id,
    updatedAt,
    deleted: true as const,
})

it('brings back the backup, deletes what came after it, and stamps every change now', () => {
    const backup: SealedRecord[] = [
        live('kept', 1),
        live('edited', 1),
        live('deleted-since', 1),
        gone('long-gone', 1),
    ]
    const current: SealedRecord[] = [
        live('kept', 1),
        live('edited', 5),
        gone('deleted-since', 5),
        live('added-since', 5),
        gone('long-gone', 1),
        gone('other', 3),
    ]
    expect(restoredRecords(current, backup, 9)).toEqual([
        live('edited', 9, 'edited@1'),
        live('deleted-since', 9, 'deleted-since@1'),
        gone('added-since', 9),
    ])
})

it('restamps a record whose sealed parts differ even at the same time', () => {
    const current: SealedRecord[] = [{ ...live('a', 1), secret: 'new' }]
    const backup: SealedRecord[] = [{ ...live('a', 1), secret: 'old' }]
    expect(restoredRecords(current, backup, 9)).toEqual([
        { ...live('a', 9, 'a@1'), secret: 'old' },
    ])
})
