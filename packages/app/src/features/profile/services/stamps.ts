const DAY_MS = 86_400_000
const startOfDay = (ms: number) => new Date(ms).setHours(0, 0, 0, 0)

/** A moment as a date and a time: "Today" or "Yesterday" for the last two days, a calendar date after. */
export function stampParts(at: number, now: number, locale: string) {
    const daysAgo = Math.round((startOfDay(now) - startOfDay(at)) / DAY_MS)
    const named = daysAgo === 0 || daysAgo === 1
    const date = named
        ? new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
              .format(-daysAgo || 0, 'day')
              .replace(/^./u, (first) => first.toLocaleUpperCase(locale))
        : new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(at)
    const time = new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(
        at,
    )
    return { date, time }
}
