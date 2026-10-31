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

/** How long ago `at` was in its largest whole unit ("2 min ago", "3 hr ago", "5 days ago"); null under a minute. */
export function formatAgo(at: number, now: number): string | null {
    const minutes = Math.floor((now - at) / MINUTE_MS)
    if (minutes < 1) return null
    const relative = new Intl.RelativeTimeFormat(LOCALE, { style: 'short' })
    if (minutes < 60) return relative.format(-minutes, 'minute')
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return relative.format(-hours, 'hour')
    return relative.format(-Math.floor(hours / 24), 'day')
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
