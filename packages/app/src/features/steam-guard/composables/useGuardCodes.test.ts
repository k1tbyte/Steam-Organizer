import 'fake-indexeddb/auto'

import { createPinia, setActivePinia } from 'pinia'
import { afterEach, expect, it, vi } from 'vitest'
import { createApp } from 'vue'

import { PLATFORM } from '#core'

import { demoGuardCode, guardPhase } from '../services/guardCode'
import { useGuardCodes } from './useGuardCodes'

afterEach(() => vi.useRealTimers())

it('waits for the Steam clock before a code of this instant', async () => {
    vi.useFakeTimers({ now: 1_000_000, toFake: ['Date'] })
    let answer = (_: Response) => {}
    const fetch = (() =>
        new Promise<Response>((resolve) => {
            answer = resolve
        })) as typeof globalThis.fetch
    const app = createApp({}).provide(PLATFORM, {
        kind: 'extension',
        fetch,
        google: null,
    })
    setActivePinia(createPinia())
    const codeOf = app.runWithContext(useGuardCodes)

    // A copy asked while the read is in flight; Steam runs 45 s ahead.
    const copied = codeOf('sample')
    answer(Response.json({ response: { server_time: '1045' } }))
    const steam = guardPhase(1_045_500).period
    expect(steam).not.toBe(guardPhase(1_000_000).period)
    expect(await copied).toBe(demoGuardCode('sample', steam))
})
