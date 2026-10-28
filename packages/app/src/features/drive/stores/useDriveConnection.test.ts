import { DriveError } from '@so/core'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createApp } from 'vue'

import { DRIVE_ACCOUNT_STORAGE_KEY, type GoogleAuth, PLATFORM } from '#core'

import { useDriveConnection } from './useDriveConnection'

const HOUR = 60 * 60 * 1000
const stored = new Map<string, string>()

beforeEach(() => {
    stored.clear()
    vi.stubGlobal('localStorage', {
        getItem: (key: string) => stored.get(key) ?? null,
        setItem: (key: string, value: string) => stored.set(key, value),
    })
})
afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
})

const remembered = () =>
    stored.set(
        DRIVE_ACCOUNT_STORAGE_KEY,
        JSON.stringify({ name: 'Alex', email: 'alex@x.com' }),
    )

/** Google that grants `t1` (silently too with `silent`), and Drive answering `status` to every call but `about`, which names `owner`. */
function setup({ status = 200, silent = false, owner = 'alex@x.com' } = {}) {
    const google = {
        token: vi.fn(async (interactive: boolean, _hint?: string) =>
            interactive || silent
                ? { token: 't1', expiresAt: Date.now() + HOUR }
                : null,
        ),
        revoke: vi.fn(async () => {}),
    } satisfies GoogleAuth
    const bearers: string[] = []
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
        bearers.push(new Headers(init.headers).get('Authorization') ?? '')
        if (url.includes('/about'))
            return owner
                ? Response.json({
                      user: { displayName: 'Alex', emailAddress: owner },
                  })
                : new Response(null, { status: 503 })
        return Response.json({ files: [] }, { status })
    })
    const app = createApp({}).provide(PLATFORM, {
        kind: 'web',
        fetch: null,
        google,
    })
    const pinia = createPinia()
    app.use(pinia)
    setActivePinia(pinia)
    return { store: useDriveConnection(), google, bearers }
}

it('signs in from a click, keeps the account and runs Drive under the token', async () => {
    const { store, bearers } = setup()
    expect(store.state).toBe('disconnected')
    expect(await store.connect()).toBe(true)
    expect(store.state).toBe('connected')
    expect(store.account).toEqual({ name: 'Alex', email: 'alex@x.com' })
    expect(JSON.parse(stored.get(DRIVE_ACCOUNT_STORAGE_KEY) ?? '')).toEqual(
        store.account,
    )
    expect(await store.run((drive) => drive.list({ kind: 'backup' }))).toEqual(
        [],
    )
    expect(bearers).toEqual(['Bearer t1', 'Bearer t1'])
})

it('ignores a second click while the Google window is open', async () => {
    const { store, google } = setup()
    const first = store.connect()
    expect(store.connecting).toBe(true)
    expect(await store.connect()).toBe(false)
    expect(await first).toBe(true)
    expect(store.connecting).toBe(false)
    expect(google.token).toHaveBeenCalledTimes(1)
})

it('turns expired on a refused token until the user signs in again', async () => {
    const { store } = setup({ status: 401 })
    await store.connect()
    await expect(
        store.run((drive) => drive.list({ kind: 'backup' })),
    ).rejects.toEqual(new DriveError('unauthorized'))
    expect(store.state).toBe('expired')
    await store.connect()
    expect(store.state).toBe('connected')
})

it('starts expired where no token comes without a click (the web after a reload)', async () => {
    remembered()
    const { store, google } = setup()
    await vi.waitFor(() => expect(store.state).toBe('expired'))
    expect(google.token).toHaveBeenCalledWith(false, 'alex@x.com')
})

it('keeps a silent token only for the saved account', async () => {
    remembered()
    const { store } = setup({ silent: true, owner: 'sam@x.com' })
    await vi.waitFor(() => expect(store.state).toBe('expired'))
})

it('turns expired when the account behind a silent token cannot be read', async () => {
    remembered()
    const { store } = setup({ silent: true, owner: '' })
    await vi.waitFor(() => expect(store.state).toBe('expired'))
})

it('turns expired when the token runs out and no silent one comes, still revocable', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'Date'] })
    const { store, google } = setup()
    await store.connect()
    await vi.advanceTimersByTimeAsync(HOUR)
    expect(store.state).toBe('expired')
    await store.disconnect()
    expect(google.revoke).toHaveBeenCalledWith('t1')
})

it('changes nothing when the account behind a new token cannot be read', async () => {
    remembered()
    const { store } = setup({ owner: '' })
    await vi.waitFor(() => expect(store.state).toBe('expired'))
    await expect(store.connect()).rejects.toEqual(new DriveError('server'))
    expect(store.state).toBe('expired')
})

it('lets go of a sign-in that lands after disconnect', async () => {
    const { store, google } = setup()
    const late = store.connect()
    await store.disconnect()
    expect(await late).toBe(false)
    expect(store.state).toBe('disconnected')
    expect(google.revoke).toHaveBeenCalledWith('t1')
})

it('lets go of a late sign-in even when its account cannot be read', async () => {
    const { store, google } = setup({ owner: '' })
    const late = store.connect()
    await store.disconnect()
    await expect(late).rejects.toEqual(new DriveError('server'))
    expect(google.revoke).toHaveBeenCalledWith('t1')
})

it('revokes and forgets on disconnect', async () => {
    const { store, google } = setup()
    await store.connect()
    await store.disconnect()
    expect(google.revoke).toHaveBeenCalledWith('t1')
    expect(store.state).toBe('disconnected')
    expect(stored.get(DRIVE_ACCOUNT_STORAGE_KEY)).toBe('')
})
