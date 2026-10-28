import { afterEach, expect, it, vi } from 'vitest'

import { SteamError } from './api'
import { steamClockOffset } from './time'

afterEach(() => vi.useRealTimers())

it('reads how far Steam runs ahead, by POST', async () => {
    vi.useFakeTimers({ now: 1_000_000 })
    const fetch = vi.fn(async (request: Request) => {
        expect(request.method).toBe('POST')
        expect(new URL(request.url).pathname).toBe(
            '/ITwoFactorService/QueryTime/v1/',
        )
        vi.setSystemTime(1_000_200)
        return Response.json({ response: { server_time: '1030' } })
    }) as unknown as typeof globalThis.fetch
    // Steam read 1030.5 s at the trip's midpoint, 1000.1 s here.
    expect(await steamClockOffset(fetch)).toBe(30_400)
})

it('fails as a SteamError when Steam is out of reach', async () => {
    const fetch = (() =>
        Promise.reject(new TypeError('offline'))) as typeof globalThis.fetch
    await expect(steamClockOffset(fetch)).rejects.toBeInstanceOf(SteamError)
})
