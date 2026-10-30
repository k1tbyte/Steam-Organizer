import type { SealedRecord } from '@so/core'

/** The changes that turn `current` into the backup's records, stamped `now`, so a sync carries the restore everywhere. */
export function restoredRecords(
    current: readonly SealedRecord[],
    backup: readonly SealedRecord[],
    now: number,
): SealedRecord[] {
    const live = new Map(
        current.flatMap((record) =>
            'deleted' in record ? [] : [[record.id, record] as const],
        ),
    )
    const restored: SealedRecord[] = []
    for (const record of backup) {
        if ('deleted' in record) continue
        const same = live.get(record.id)
        live.delete(record.id)
        if (
            same?.updatedAt === record.updatedAt &&
            same.data === record.data &&
            same.secret === record.secret
        )
            continue
        restored.push({ ...record, updatedAt: now })
    }
    for (const id of live.keys())
        restored.push({ id, updatedAt: now, deleted: true })
    return restored
}
