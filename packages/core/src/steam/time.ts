import { requestJson, STEAM_API } from './api'

const TIMEOUT_MS = 3000

/** How far Steam's clock runs ahead of this device's, in ms. Keyless and POST only. */
export async function steamClockOffset(
    fetch: typeof globalThis.fetch,
): Promise<number> {
    const sent = Date.now()
    const { response } = await requestJson<{
        response: { server_time: string }
    }>(
        fetch,
        // A code waits for this read, so a stalled one gives up.
        new Request(`${STEAM_API}ITwoFactorService/QueryTime/v1/`, {
            method: 'POST',
            signal: AbortSignal.timeout(TIMEOUT_MS),
        }),
    )
    // Steam answers whole seconds, so its time sits half a second past them; it read it halfway through the trip.
    return Number(response.server_time) * 1000 + 500 - (sent + Date.now()) / 2
}
