import { steamCache } from '../storage/steamCache'
import { getJson } from './api'
import { STEAM_CURRENCIES, type SteamCurrency } from './currencies'

const STORE = 'https://store.steampowered.com/api/appdetails'
// Steam answers 250 apps per request; the store allows ~200 requests per 5 minutes.
const BATCH = 200
const PRICE_TTL = 7 * 24 * 60 * 60 * 1000

type AppDetails = Record<
    string,
    { success: boolean; data?: { price_overview?: { initial: number } } | [] }
>

/** Undiscounted store prices in hundredths of the currency `cc` quotes; null for a free or unsold game. */
async function fetchPrices(
    fetch: typeof globalThis.fetch,
    appIds: readonly number[],
    cc: string,
): Promise<Map<number, number | null>> {
    const prices = new Map<number, number | null>()
    for (let at = 0; at < appIds.length; at += BATCH) {
        const batch = appIds.slice(at, at + BATCH)
        const details = await getJson<AppDetails>(
            fetch,
            `${STORE}?${new URLSearchParams({ appids: batch.join(','), filters: 'price_overview', cc })}`,
            // The store has no key: a refusal is its rate limit.
            (status) =>
                status === 403 || status === 429 ? 'rate-limit' : 'server',
        )
        for (const appId of batch) {
            const data = details[appId]?.data
            prices.set(
                appId,
                data && !Array.isArray(data)
                    ? (data.price_overview?.initial ?? null)
                    : null,
            )
        }
    }
    return prices
}

/** The prices of these apps in `currency`: cached ones under a week old, the rest fetched and cached. */
export async function libraryPrices(
    fetch: typeof globalThis.fetch,
    appIds: readonly number[],
    currency: SteamCurrency,
    now = Date.now(),
) {
    const prices = await steamCache.prices(currency, now - PRICE_TTL)
    const missing = appIds.filter((appId) => !prices.has(appId))
    if (missing.length === 0) return prices
    const fetched = await fetchPrices(
        fetch,
        missing,
        STEAM_CURRENCIES[currency],
    )
    await steamCache.putPrices(currency, fetched, now)
    for (const [appId, cents] of fetched) prices.set(appId, cents)
    return prices
}
