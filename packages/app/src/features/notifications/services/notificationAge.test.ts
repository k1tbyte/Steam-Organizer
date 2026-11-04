import { expect, it } from 'vitest'

import { ageOf } from './notificationAge'

// Local time, as the labels count calendar days.
const NOW = new Date(2026, 10, 3, 14, 30).getTime()
const at = (day: number, hour: number, minute = 0) =>
    new Date(2026, 10, day, hour, minute).getTime()

it('says now under a minute, then minutes, then hours within today', () => {
    expect(ageOf(NOW - 20_000, NOW)).toEqual({ unit: 'now' })
    expect(ageOf(at(3, 14, 25), NOW)).toEqual({ unit: 'minute', count: 5 })
    expect(ageOf(at(3, 12, 10), NOW)).toEqual({ unit: 'hour', count: 2 })
    expect(ageOf(at(3, 0, 5), NOW)).toEqual({ unit: 'hour', count: 14 })
})

it('says Yesterday for any time yesterday, then calendar days', () => {
    expect(ageOf(at(2, 23, 50), NOW)).toEqual({ unit: 'yesterday' })
    expect(ageOf(at(2, 0, 10), NOW)).toEqual({ unit: 'yesterday' })
    expect(ageOf(at(1, 23, 59), NOW)).toEqual({ unit: 'day', count: 2 })
    expect(ageOf(at(1, 0, 0), NOW)).toEqual({ unit: 'day', count: 2 })
    expect(ageOf(new Date(2026, 9, 20, 9).getTime(), NOW)).toEqual({
        unit: 'day',
        count: 14,
    })
})

it('reads a time ahead of this clock as now', () => {
    expect(ageOf(NOW + 5 * 60_000, NOW)).toEqual({ unit: 'now' })
})
