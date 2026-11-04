import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { NOTIFICATIONS_STORAGE_KEY } from '#core/storage'
import { useVaultSession } from '#features/vault'
import type { NotificationEvent } from '../model'
import { useNotificationLog } from './notificationLog'

vi.mock('#features/vault', async () => {
    const { reactive } = await import('vue')
    const session = reactive({ vault: null })
    return { useVaultSession: () => session }
})

/** The open vault, switched as the session would. */
const open = useVaultSession() as unknown as { vault: { id: string } | null }

const stored = new Map<string, string>()
const BAN: NotificationEvent = {
    kind: 'ban',
    account: 'acc-1',
    bans: ['vac'],
}
const REFRESH: NotificationEvent = {
    kind: 'refresh',
    updated: 42,
    fresh: 3,
    missing: 0,
    left: 1,
    failed: true,
}

/** A page load: a new store over what this device stored. */
function reload() {
    setActivePinia(createPinia())
    return useNotificationLog()
}

beforeEach(() => {
    stored.clear()
    open.vault = { id: 'vault-a' }
    vi.stubGlobal('localStorage', {
        getItem: (key: string) => stored.get(key) ?? null,
        setItem: (key: string, value: string) => stored.set(key, value),
    })
})
afterEach(() => {
    vi.unstubAllGlobals()
})

it('logs events newest first, unread, with the route a click takes', () => {
    const log = reload()
    log.push('vault-a', REFRESH)
    log.push('vault-a', BAN, { route: '/accounts/acc-1' })
    expect(log.entries).toMatchObject([
        { ...BAN, read: false, route: '/accounts/acc-1' },
        { ...REFRESH, read: false },
    ])
    expect(log.entries?.[1]).not.toHaveProperty('route')
})

it('keeps the latest 50', () => {
    const log = reload()
    for (let n = 0; n < 53; n++)
        log.push('vault-a', { kind: 'backup', accounts: n, bytes: 1 })
    expect(log.entries).toHaveLength(50)
    expect(log.entries?.[0]).toMatchObject({ accounts: 52 })
    expect(log.entries?.[49]).toMatchObject({ accounts: 3 })
    expect(reload().entries).toHaveLength(50)
})

it('keeps each entry read or unread across a reload, and Mark all read with it', () => {
    let log = reload()
    log.push('vault-a', REFRESH)
    log.push('vault-a', BAN)
    log.markRead(log.entries?.[1]?.id ?? '')
    log = reload()
    expect(log.entries?.map((entry) => entry.read)).toEqual([false, true])

    log.markAllRead()
    expect(reload().entries?.map((entry) => entry.read)).toEqual([true, true])
})

it('keeps a log per vault, read state included, and shows none with no vault open', () => {
    const log = reload()
    log.push('vault-a', REFRESH)
    // A backup that finished after another vault opened still lands in its own.
    log.push('vault-b', BAN)
    expect(log.entries).toMatchObject([REFRESH])

    open.vault = { id: 'vault-b' }
    expect(log.entries).toMatchObject([BAN])
    log.markAllRead()

    open.vault = { id: 'vault-a' }
    expect(log.entries?.map((entry) => entry.read)).toEqual([false])
    open.vault = null
    expect(log.entries).toBeNull()
})

it('stores kinds, numbers, account ids and routes only, whatever a producer hands over', () => {
    const log = reload()
    log.push('vault-a', {
        ...BAN,
        name: 'bunny hop',
        login: 'bunnyhop42',
    } as NotificationEvent)
    log.push('vault-a', { ...REFRESH, note: 'main' } as NotificationEvent)
    log.push('vault-a', { kind: 'update', version: '3.0.2' })

    const raw = stored.get(NOTIFICATIONS_STORAGE_KEY) ?? ''
    for (const leak of ['bunny hop', 'bunnyhop42', 'main'])
        expect(raw).not.toContain(leak)
    const entries = JSON.parse(raw)['vault-a'] as Record<string, unknown>[]
    expect(entries.map((entry) => Object.keys(entry).sort())).toEqual([
        ['at', 'id', 'kind', 'read', 'version'],
        [
            'at',
            'failed',
            'fresh',
            'id',
            'kind',
            'left',
            'missing',
            'read',
            'updated',
        ],
        ['account', 'at', 'bans', 'id', 'kind', 'read'],
    ])
})

it('logs an event once when asked, as a build still waiting after a reload', () => {
    const log = reload()
    const update: NotificationEvent = { kind: 'update', version: '3.0.2' }
    log.push('vault-a', update, { once: true })
    log.markAllRead()
    reload().push('vault-a', update, { once: true })
    expect(reload().entries).toMatchObject([{ ...update, read: true }])
    reload().push(
        'vault-a',
        { kind: 'update', version: '3.0.3' },
        { once: true },
    )
    expect(reload().entries).toHaveLength(2)
})

it("drops entries it cannot read and keeps another tab's", () => {
    stored.set(
        NOTIFICATIONS_STORAGE_KEY,
        JSON.stringify({
            'vault-a': [
                {
                    id: 'x',
                    at: 1,
                    read: false,
                    kind: 'ban',
                    account: 'acc-2',
                    bans: ['vac'],
                },
                { id: 'y', at: 2, kind: 'mystery' },
                {
                    id: 'z',
                    at: 3,
                    kind: 'refresh',
                    updated: -1,
                    fresh: 0,
                    missing: 0,
                    left: 0,
                },
            ],
        }),
    )
    const log = reload()
    expect(log.entries?.map((entry) => entry.id)).toEqual(['x'])

    const other = JSON.parse(stored.get(NOTIFICATIONS_STORAGE_KEY) ?? '{}')
    other['vault-a'].unshift({
        id: 'w',
        at: 4,
        read: false,
        kind: 'update',
        version: null,
    })
    stored.set(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(other))
    log.push('vault-a', BAN)
    expect(log.entries?.map((entry) => entry.id).slice(1)).toEqual(['w', 'x'])
})

it('keeps changes a failed write did not save, and still takes what another page wrote', () => {
    const log = reload()
    log.push('vault-a', REFRESH)
    vi.stubGlobal('localStorage', {
        getItem: (key: string) => stored.get(key) ?? null,
        setItem: () => {
            throw new DOMException('quota', 'QuotaExceededError')
        },
    })
    log.push('vault-a', BAN)
    log.push('vault-a', { kind: 'update', version: '3.0.2' })
    expect(log.entries).toHaveLength(3)
    log.markRead(log.entries?.[0]?.id ?? '')
    expect(log.entries?.map((entry) => entry.read)).toEqual([
        true,
        false,
        false,
    ])

    const other = JSON.parse(stored.get(NOTIFICATIONS_STORAGE_KEY) ?? '{}')
    other['vault-a'].unshift({
        id: 'w',
        at: 9,
        read: false,
        kind: 'backup',
        accounts: 1,
        bytes: 1,
    })
    stored.set(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(other))
    log.markAllRead()
    expect(log.entries?.map((entry) => entry.id).slice(0, 1)).toEqual(['w'])
    expect(log.entries?.every((entry) => entry.read)).toBe(true)
})

it('keeps the log in memory where storage is denied', () => {
    vi.stubGlobal('localStorage', {
        getItem: () => {
            throw new Error('denied')
        },
        setItem: () => {
            throw new Error('denied')
        },
    })
    const log = reload()
    log.push('vault-a', REFRESH)
    log.push('vault-a', BAN)
    expect(log.entries).toHaveLength(2)
})
