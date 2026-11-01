import {
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
    try {
        const saved = JSON.parse(
            readStored(SECURITY_SETTINGS_STORAGE_KEY) || '{}',
        ) as Partial<SecuritySettings>
        return {
            lockAfter:
                LOCK_AFTER.find((value) => value === saved.lockAfter) ??
                SECURITY_DEFAULTS.lockAfter,
            masterAfterRestart:
                typeof saved.masterAfterRestart === 'boolean'
                    ? saved.masterAfterRestart
                    : SECURITY_DEFAULTS.masterAfterRestart,
        }
    } catch {
        return SECURITY_DEFAULTS
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

/** A kept session idle past its timeout. No record of activity counts as idle: it fails closed. */
export function isIdle(
    { lockAfter }: SecuritySettings,
    lastActive: number | undefined,
    now: number,
): boolean {
    const limit = timeoutMs(lockAfter)
    if (limit === null) return false
    return lastActive === undefined || now - lastActive >= limit
}
