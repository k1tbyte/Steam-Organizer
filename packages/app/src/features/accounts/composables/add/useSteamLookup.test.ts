import { type SteamError, steamApi } from '@so/core'
import { beforeEach, expect, it, vi } from 'vitest'
import { effectScope, ref } from 'vue'

import { useSteamLookup } from './useSteamLookup'

const ID = '76561199044795099'
let gate: Promise<void> = Promise.resolve()
let down = false

const fetch = (async (input: string | URL | Request) => {
    await gate
    if (down) return new Response('', { status: 503 })
    const url = new URL(String(input))
    const reply: Record<string, unknown> = {
        '/ISteamUser/ResolveVanityURL/v1/':
            url.searchParams.get('vanityurl') === 'kyzzdef'
                ? { response: { success: 1, steamid: ID } }
                : { response: { success: 42 } },
        '/ISteamUser/GetPlayerSummaries/v2/': {
            response: {
                players: [
                    {
                        steamid: ID,
                        personaname: 'kyzz',
                        avatarhash: '',
                        profileurl: '',
                        communityvisibilitystate: 1,
                    },
                ],
            },
        },
        '/ISteamUser/GetPlayerBans/v1/': { players: [] },
    }
    return new Response(JSON.stringify(reply[url.pathname]))
}) as typeof globalThis.fetch

const key = ref<string | null>('KEY')
vi.mock('#features/steam', () => ({
    useSteamApi: () => ({
        api: async () => steamApi(fetch, key.value ?? ''),
    }),
    useSteamKey: () => ({ key }),
    useSteamProblem: () => ({
        problemOf: (error: unknown) => {
            const { kind } = error as SteamError
            return { kind, fix: kind === 'no-key' ? 'settings' : 'retry' }
        },
    }),
}))

beforeEach(() => {
    vi.useFakeTimers()
    key.value = 'KEY'
    gate = Promise.resolve()
    down = false
})

function lookup() {
    const input = ref<string | null>(null)
    const scope = effectScope()
    const looked = scope.run(() => useSteamLookup(() => input.value))
    if (!looked) throw new Error('no lookup')
    return { input, ...looked }
}

it('finds the profile behind a vanity name once typing pauses', async () => {
    const { input, state } = lookup()
    input.value = 'kyzzdef'
    await vi.advanceTimersByTimeAsync(0)
    expect(state.value.status).toBe('looking')
    await vi.advanceTimersByTimeAsync(400)
    expect(state.value).toMatchObject({
        status: 'found',
        steamId: ID,
        profile: { nickname: 'kyzz' },
    })
})

it('tells a name Steam does not know from Steam being down, and retries', async () => {
    const { input, state, retry } = lookup()
    input.value = 'nobody'
    await vi.advanceTimersByTimeAsync(400)
    expect(state.value.status).toBe('missing')

    down = true
    input.value = 'kyzzdef'
    await vi.advanceTimersByTimeAsync(400)
    expect(state.value).toMatchObject({
        status: 'failed',
        problem: { kind: 'server' },
    })
    down = false
    // Only a key failure waits for a new key.
    key.value = 'OTHER'
    await vi.advanceTimersByTimeAsync(400)
    expect(state.value.status).toBe('failed')
    retry()
    await vi.advanceTimersByTimeAsync(0)
    expect(state.value.status).toBe('found')
})

it('drops a reply to an input that changed meanwhile', async () => {
    const { input, state } = lookup()
    let open = () => {}
    gate = new Promise((resolve) => {
        open = resolve
    })
    input.value = 'kyzzdef'
    await vi.advanceTimersByTimeAsync(400)
    input.value = null
    open()
    await vi.advanceTimersByTimeAsync(0)
    expect(state.value.status).toBe('idle')
})

it('looks again once a key is saved for a lookup that failed without one', async () => {
    const { input, state } = lookup()
    key.value = ''
    input.value = 'kyzzdef'
    await vi.advanceTimersByTimeAsync(400)
    expect(state.value).toMatchObject({
        status: 'failed',
        problem: { kind: 'no-key' },
    })
    key.value = 'KEY'
    await vi.advanceTimersByTimeAsync(400)
    expect(state.value.status).toBe('found')
})
