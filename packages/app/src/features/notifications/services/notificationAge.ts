import { backupDay } from '#core/format'

const MINUTE_MS = 60_000
const DAY_MS = 86_400_000

/** How old an entry is, in the bell's compact steps: "now", "5 min", "2 h", "Yesterday", "3 d". */
export type Age =
    | { unit: 'now' | 'yesterday' }
    | { unit: 'minute' | 'hour' | 'day'; count: number }

const midnight = (at: number) => new Date(at).setHours(0, 0, 0, 0)

export function ageOf(at: number, now: number): Age {
    const day = backupDay(at, now)
    if (day === 'yesterday') return { unit: 'yesterday' }
    if (day === 'older')
        return {
            unit: 'day',
            // Calendar days, as "Yesterday" counts them; rounding absorbs a DST hour.
            count: Math.round((midnight(now) - midnight(at)) / DAY_MS),
        }
    const minutes = Math.floor((now - at) / MINUTE_MS)
    if (minutes < 1) return { unit: 'now' }
    if (minutes < 60) return { unit: 'minute', count: minutes }
    return { unit: 'hour', count: Math.floor(minutes / 60) }
}
