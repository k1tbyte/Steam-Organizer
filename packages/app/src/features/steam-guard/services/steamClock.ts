import { steamClockOffset } from '@so/core'

// Steam's own QueryTime asks to probe hourly.
const RESYNC_MS = 60 * 60 * 1000

let offset = 0
let checkedAt = Number.NEGATIVE_INFINITY
let reading: Promise<void> = Promise.resolve()

/** This instant on Steam's clock: a device clock off by half a window gives codes Steam refuses. */
export const steamNow = () => Date.now() + offset

/** Reads Steam's clock at most hourly; resolves once the read in flight lands. A failure keeps the last offset:
 *  offline, web (no fetch) and the autofill content script (CORS-bound to the Steam page) stay on the device clock. */
export function syncSteamClock(fetch: typeof globalThis.fetch | null) {
    if (fetch && Date.now() - checkedAt >= RESYNC_MS) {
        checkedAt = Date.now()
        reading = steamClockOffset(fetch).then(
            (found) => {
                offset = found
            },
            () => {},
        )
    }
    return reading
}
