import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { type LockAfter, SECURITY_DEFAULTS } from '../model'
import {
    isIdle,
    keepsPastRestart,
    keepsSession,
    readSecuritySettings,
    timeoutMs,
} from './lockPolicy'

const MINUTE = 60_000
const settings = (lockAfter: LockAfter, masterAfterRestart = false) => ({
    lockAfter,
    masterAfterRestart,
})

function stored(value: string | null) {
    vi.stubGlobal('localStorage', {
        getItem: () => value,
    })
}

beforeEach(() => stored(null))
afterEach(() => vi.unstubAllGlobals())

it('reads the stored policy and falls back to the defaults for anything it does not know', () => {
    expect(readSecuritySettings()).toEqual(SECURITY_DEFAULTS)
    stored('{"lockAfter":"4h","masterAfterRestart":true}')
    expect(readSecuritySettings()).toEqual(settings('4h', true))
    stored('{"lockAfter":"soon","masterAfterRestart":"yes"}')
    expect(readSecuritySettings()).toEqual(SECURITY_DEFAULTS)
    stored('not json')
    expect(readSecuritySettings()).toEqual(SECURITY_DEFAULTS)
})

it('gives the timed policies a limit and the others none', () => {
    expect(timeoutMs('1m')).toBe(MINUTE)
    expect(timeoutMs('4h')).toBe(240 * MINUTE)
    expect((['now', 'restart', 'never'] as const).map(timeoutMs)).toEqual([
        null,
        null,
        null,
    ])
})

it('keeps a session for every policy but Immediately, and past a restart only for Never without the master password', () => {
    expect(keepsSession(settings('now'))).toBe(false)
    expect(keepsSession(settings('1m'))).toBe(true)
    expect(keepsPastRestart(settings('never'))).toBe(true)
    expect(keepsPastRestart(settings('never', true))).toBe(false)
    expect(keepsPastRestart(settings('1m'))).toBe(false)
})

it('calls a kept session idle at its limit, and one with no activity record too', () => {
    expect(isIdle(settings('1m'), 1000, 1000 + MINUTE - 1)).toBe(false)
    expect(isIdle(settings('1m'), 1000, 1000 + MINUTE)).toBe(true)
    expect(isIdle(settings('1m'), undefined, 1000)).toBe(true)
    expect(isIdle(settings('never'), undefined, 1000)).toBe(false)
})
