import type { Backup, SealedRecord } from '@so/core'

/** At most one auto backup a day. */
export const AUTO_BACKUP_EVERY_MS = 24 * 60 * 60 * 1000
/** The newest auto backups kept; manual ones are never deleted. */
export const AUTO_BACKUPS_KEPT = 10
/** How long the vault rests after a change before the check. */
export const AUTO_BACKUP_AFTER_CHANGE_MS = 30_000

const autos = (backups: readonly Backup[]) =>
    backups
        .filter(({ kind }) => kind === 'auto')
        .sort((a, b) => b.createdAt - a.createdAt)

/** None in the last day, and some record changed after the newest one (or there is none). */
export function autoBackupDue(
    backups: readonly Backup[],
    records: readonly SealedRecord[],
    now: number,
): boolean {
    const newest = autos(backups)[0]
    if (newest && now - newest.createdAt < AUTO_BACKUP_EVERY_MS) return false
    const since = newest?.createdAt ?? Number.NEGATIVE_INFINITY
    return records.some(({ updatedAt }) => updatedAt > since)
}

/** The auto backups past the newest ten. */
export const prunedAutoBackups = (backups: readonly Backup[]) =>
    autos(backups).slice(AUTO_BACKUPS_KEPT)
