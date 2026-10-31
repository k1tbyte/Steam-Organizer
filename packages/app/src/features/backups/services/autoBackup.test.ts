import type { Backup, SealedRecord } from '@so/core'
import { expect, it } from 'vitest'

import {
    AUTO_BACKUP_EVERY_MS,
    autoBackupDue,
    prunedAutoBackups,
} from './autoBackup'

const DAY = AUTO_BACKUP_EVERY_MS
const NOW = 100 * DAY

const backup = (id: string, createdAt: number, kind: Backup['kind'] = 'auto') =>
    ({ id, createdAt, kind }) as Backup
const changedAt = (updatedAt: number) =>
    [{ id: 'a', updatedAt, deleted: true }] as SealedRecord[]

it('saves one when there is none and the vault has records', () => {
    expect(autoBackupDue([], changedAt(1), NOW)).toBe(true)
    expect(autoBackupDue([], [], NOW)).toBe(false)
})

it('saves at most one a day, and only after a change', () => {
    const yesterday = [backup('b', NOW - DAY)]
    expect(autoBackupDue(yesterday, changedAt(NOW - 1), NOW)).toBe(true)
    expect(autoBackupDue(yesterday, changedAt(NOW - DAY), NOW)).toBe(false)
    const recent = [backup('b', NOW - DAY + 1)]
    expect(autoBackupDue(recent, changedAt(NOW - 1), NOW)).toBe(false)
    // A manual backup today does not hold the daily one back.
    const manual = [backup('m', NOW - 1, 'manual'), ...yesterday]
    expect(autoBackupDue(manual, changedAt(NOW - 1), NOW)).toBe(true)
})

it('prunes auto backups past the newest ten, never a manual one', () => {
    const backups = [
        ...Array.from({ length: 12 }, (_, day) => backup(`a${day}`, day)),
        backup('m', 0, 'manual'),
    ]
    expect(prunedAutoBackups(backups).map(({ id }) => id)).toEqual(['a1', 'a0'])
})
