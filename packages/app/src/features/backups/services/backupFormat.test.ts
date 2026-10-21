import { describe, expect, it } from 'vitest'

import { backupDay, formatDate, formatSize, formatTime } from './backupFormat'

const at = (day: number, hour: number, minute = 0) =>
    new Date(2026, 9, day, hour, minute).getTime()

describe('backupDay', () => {
    const now = at(21, 14, 5)

    it('calls the last minute now', () => {
        expect(backupDay(now - 30_000, now)).toBe('now')
    })

    it('splits today, yesterday and older at local midnight', () => {
        expect(backupDay(at(21, 0, 0), now)).toBe('today')
        expect(backupDay(at(20, 23, 59), now)).toBe('yesterday')
        expect(backupDay(at(19, 23, 59), now)).toBe('older')
    })

    it('reads a later timestamp as today, not now', () => {
        expect(backupDay(at(21, 18), now)).toBe('today')
    })
})

describe('formatting', () => {
    it('writes the time on 24 hours and the date with a short month', () => {
        expect(formatTime(at(7, 11, 40))).toBe('11:40')
        expect(formatTime(at(7, 0, 5))).toBe('00:05')
        expect(formatDate(at(7, 11, 40))).toBe('7 Oct 2026')
        expect(formatDate(new Date(2026, 8, 19).getTime())).toBe('19 Sep 2026')
    })

    it('sizes in KB up to a megabyte, then MB', () => {
        expect(formatSize(186 * 1024)).toBe('186 KB')
        expect(formatSize(10)).toBe('1 KB')
        expect(formatSize(2.5 * 1024 * 1024)).toBe('2.5 MB')
    })
})
