import {
    flag,
    oneOf,
    parseRecord,
    readStored,
    SECURITY_SETTINGS_STORAGE_KEY,
} from '../../../core/storage'
import {
    LOCK_AFTER,
    type LockAfter,
    SECURITY_DEFAULTS,
    type SecuritySettings,
} from '../model'

const MINUTE_MS = 60_000
const TIMEOUT_MS: Partial<Record<LockAfter, number>> = {
    '1m': MINUTE_MS,
    '5m': 5 * MINUTE_MS,
    '15m': 15 * MINUTE_MS,
    '30m': 30 * MINUTE_MS,
    '1h': 60 * MINUTE_MS,
    '4h': 240 * MINUTE_MS,
}

/** Read from storage each time: the popup and the app page share it, and each must see the other's change. */
export function readSecuritySettings(): SecuritySettings {
    const saved = parseRecord(readStored(SECURITY_SETTINGS_STORAGE_KEY))
    return {
        lockAfter: oneOf(
            LOCK_AFTER,
            saved.lockAfter,
            SECURITY_DEFAULTS.lockAfter,
        ),
        masterAfterRestart: flag(
            saved.masterAfterRestart,
            SECURITY_DEFAULTS.masterAfterRestart,
        ),
    }
}

/** The idle time a policy allows; null for the ones with no timer. */
export const timeoutMs = (lockAfter: LockAfter): number | null =>
    TIMEOUT_MS[lockAfter] ?? null

/** `now` keeps nothing. */
export const keepsSession = ({ lockAfter }: SecuritySettings) =>
    lockAfter !== 'now'

/** The kept session also sits on disk, so it survives a restart. */
export const keepsPastRestart = ({
    lockAfter,
    masterAfterRestart,
}: SecuritySettings) => lockAfter === 'never' && !masterAfterRestart

/** Milliseconds until the idle timeout, null for a policy with none. No record of activity, or one in the future
 *  (the clock went back), is already past: it fails closed. */
export function idleLeft(
    { lockAfter }: SecuritySettings,
    lastActive: number | undefined,
    now: number,
): number | null {
    const limit = timeoutMs(lockAfter)
    if (limit === null) return null
    if (lastActive === undefined || lastActive > now) return 0
    return Math.max(0, limit - (now - lastActive))
}

/** A kept session idle past its timeout. */
export const isIdle = (
    settings: SecuritySettings,
    lastActive: number | undefined,
    now: number,
) => idleLeft(settings, lastActive, now) === 0
