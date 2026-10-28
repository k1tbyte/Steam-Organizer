import { afterEach, expect, it, vi } from 'vitest'

import { steamNow, syncSteamClock } from './steamClock'

afterEach(() => vi.useRealTimers())

it('runs on Steam time once read, and reads it at most hourly', async () => {
    vi.useFakeTimers({ now: 1_000_000, toFake: ['Date'] })
    const fetch = vi.fn(async () =>
        Response.json({ response: { server_time: '1030' } }),
    ) as unknown as typeof globalThis.fetch
    syncSteamClock(null)
    expect(steamNow()).toBe(1_000_000)

    const reading = syncSteamClock(fetch)
    expect(syncSteamClock(fetch)).toBe(reading)
    await reading
    expect(steamNow()).toBe(1_030_500)
    expect(fetch).toHaveBeenCalledTimes(1)

    vi.setSystemTime(1_000_000 + 60 * 60 * 1000)
    syncSteamClock(fetch)
    expect(fetch).toHaveBeenCalledTimes(2)
})
