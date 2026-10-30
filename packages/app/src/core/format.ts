// en-GB matches the design ("11:40", day first); it follows the app locale once locales exist.
const LOCALE = 'en-GB'
const MINUTE_MS = 60_000

export type BackupDay = 'now' | 'today' | 'yesterday' | 'older'

export function backupDay(at: number, now: number): BackupDay {
    const age = now - at
    if (age >= 0 && age < MINUTE_MS) return 'now'

    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    if (at >= today.getTime()) return 'today'

    today.setDate(today.getDate() - 1)
    return at >= today.getTime() ? 'yesterday' : 'older'
}

export function formatTime(at: number): string {
    return new Intl.DateTimeFormat(LOCALE, {
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).format(at)
}

// en-GB spells September "Sept"; the design writes "Sep".
export function formatDate(at: number): string {
    const date = new Date(at)
    const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(
        date,
    )
    return `${date.getDate()} ${month} ${date.getFullYear()}`
}

const KB = 1024
const MB = KB * 1024

export function formatSize(bytes: number): string {
    if (bytes < MB) return `${Math.max(1, Math.round(bytes / KB))} KB`
    return `${(bytes / MB).toFixed(1)} MB`
}
