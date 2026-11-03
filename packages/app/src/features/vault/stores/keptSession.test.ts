import 'fake-indexeddb/auto'

import { deviceStore, steamCache } from '@so/core'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { installSessionArea, memorySessionArea, type SessionArea } from '#core'

import type { LockAfter } from '../model'
import { readActive, readKept, writeKept } from '../services/device/keptEntry'
import { useLockPolicy } from './useLockPolicy'
import { useVaultSession } from './useVaultSession'

const PASSWORD = 'correct horse'
const MINUTE = 60_000

let area: SessionArea

// One browser tab or popup: its own Pinia over the shared session area and IndexedDB.
async function page() {
    const pinia = createPinia()
    setActivePinia(pinia)
    const session = useVaultSession(pinia)
    await session.load()
    return { session, policy: useLockPolicy(pinia) }
}

// A restart: the session area is gone, the disk is not.
function restart() {
    area = memorySessionArea()
    installSessionArea(area)
}

async function createdUnder(lockAfter: LockAfter, masterAfterRestart = false) {
    const first = await page()
    await first.policy.setLockAfter(lockAfter)
    await first.policy.setMasterAfterRestart(masterAfterRestart)
    await first.session.create('Main', PASSWORD)
    // The keep runs after the open: wait for where the policy puts it.
    if (lockAfter !== 'now')
        await vi.waitFor(async () => {
            expect(await readKept()).toBeDefined()
            if (lockAfter === 'never' && !masterAfterRestart)
                expect(
                    (await deviceStore.list()).some(({ kept }) => kept),
                ).toBe(true)
        })
    return first
}

beforeEach(async () => {
    const data = new Map<string, string>()
    vi.stubGlobal('localStorage', {
        getItem: (key: string) => data.get(key) ?? null,
        setItem: (key: string, value: string) => data.set(key, value),
        removeItem: (key: string) => data.delete(key),
    })
    vi.useFakeTimers({ toFake: ['Date'] })
    restart()
    for (const name of ['steam-organizer', 'steam-organizer-device'])
        await new Promise((resolve) => {
            indexedDB.deleteDatabase(name).onsuccess = resolve
        })
})

afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
})

it('restores the session on a reload while the timeout has not passed', async () => {
    await createdUnder('5m')
    expect(await readActive()).toBeDefined()

    vi.advanceTimersByTime(4 * MINUTE)
    const { session } = await page()
    expect(session.state).toBe('unlocked')
    expect(session.vault?.name).toBe('Main')
    expect(session.contents).not.toBeNull()
})

it('locks a reload once the timeout has passed, and drops the entry', async () => {
    await createdUnder('1m')

    vi.advanceTimersByTime(MINUTE + 1)
    const { session } = await page()
    expect(session.state).toBe('locked')
    expect(await readKept()).toBeUndefined()
    // The password still opens it, and keeps it again.
    expect(await session.unlock({ method: 'pw', password: PASSWORD })).toBe(
        'opened',
    )
})

it('keeps nothing for Immediately: a reload asks the password', async () => {
    await createdUnder('now')
    expect(await readKept()).toBeUndefined()
    expect((await page()).session.state).toBe('locked')
})

it('keeps a session past any idle time for On browser restart, but not past a restart', async () => {
    await createdUnder('restart')
    vi.advanceTimersByTime(10 * 60 * MINUTE)
    expect((await page()).session.state).toBe('unlocked')

    restart()
    expect((await page()).session.state).toBe('locked')
    expect(await deviceStore.list()).toEqual([])
})

it('keeps a Never session past a restart on disk', async () => {
    await createdUnder('never')
    restart()
    const { session } = await page()
    expect(session.state).toBe('unlocked')
    // The restore writes the entry back, so the other pages see the session.
    await vi.waitFor(async () => expect(await readKept()).toBeDefined())
})

it('keeps Never in the session area only with Master password after restart', async () => {
    await createdUnder('never', true)
    expect(await readKept()).toBeDefined()
    expect((await page()).session.state).toBe('unlocked')

    restart()
    expect((await page()).session.state).toBe('locked')
})

it('moves the kept ciphertext when the policy changes, without a password', async () => {
    const { session, policy } = await createdUnder('15m')
    const entry = await readKept()
    expect(entry).toBeDefined()
    expect((await deviceStore.list()).some(({ kept }) => kept)).toBe(false)

    await policy.setLockAfter('never')
    expect((await deviceStore.list()).map(({ kept }) => kept)).toEqual([
        entry?.sealed,
    ])
    await policy.setMasterAfterRestart(true)
    expect((await deviceStore.list()).some(({ kept }) => kept)).toBe(false)
    expect(await readKept()).toEqual(entry)

    await policy.setLockAfter('now')
    expect(await readKept()).toBeUndefined()
    // This page is not locked by its own removal.
    await Promise.resolve()
    expect(session.state).toBe('unlocked')
})

it('removes the entry and the copy on disk at a lock, and with the vault', async () => {
    const { session } = await createdUnder('never')
    expect((await deviceStore.list()).some(({ kept }) => kept)).toBe(true)

    session.lock()
    await vi.waitFor(async () => expect(await readKept()).toBeUndefined())
    expect(await deviceStore.list()).toEqual([])

    expect(await session.unlock({ method: 'pw', password: PASSWORD })).toBe(
        'opened',
    )
    session.open()
    await vi.waitFor(async () => expect(await readKept()).toBeDefined())
    const id = session.vault?.id ?? ''
    await session.remove(id)
    expect(await readKept()).toBeUndefined()
    expect(await deviceStore.get(id)).toBeUndefined()
})

it('stays locked and drops an entry that no longer opens', async () => {
    const { session } = await createdUnder('15m')
    const id = session.vault?.id ?? ''
    session.lock()
    await vi.waitFor(async () => expect(await readKept()).toBeUndefined())
    await writeKept({ vault: id, sealed: new Uint8Array(60).toBase64() })

    const reloaded = await page()
    expect(reloaded.session.state).toBe('locked')
    expect(await readKept()).toBeUndefined()
})

it('locks every page when one locks, and restores a locked page when another unlocks', async () => {
    const { session: first } = await createdUnder('15m')
    first.lock()
    await vi.waitFor(async () => expect(await readKept()).toBeUndefined())

    const popup = await page()
    const app = await page()
    expect(popup.session.state).toBe('locked')
    expect(app.session.state).toBe('locked')

    expect(await app.session.unlock({ method: 'pw', password: PASSWORD })).toBe(
        'opened',
    )
    app.session.open()
    await vi.waitFor(() => expect(popup.session.state).toBe('unlocked'))
    expect(popup.session.contents).not.toBeNull()

    popup.session.lock()
    await vi.waitFor(() => expect(app.session.state).toBe('locked'))
    expect(await readKept()).toBeUndefined()
})

it('restores a page that loaded before the vault existed, once another page creates it', async () => {
    const early = await page()
    expect(early.session.state).toBe('new')

    const { session: creator } = await createdUnder('15m')
    await vi.waitFor(() => expect(early.session.state).toBe('unlocked'))
    expect(early.session.vault?.name).toBe('Main')
    // The page that knew the vault all along keeps its session, and the entry stays.
    expect(creator.state).toBe('unlocked')
    expect(await readKept()).toBeDefined()
})

it('locks a page whose restore finishes after another page locked', async () => {
    await createdUnder('15m')
    const real = area
    let reads = 0
    // The entry is there for the restore's first look, and gone for the second: a lock in between.
    installSessionArea({
        ...real,
        get: (key) =>
            key === 'so:kept' && ++reads > 1
                ? Promise.resolve(undefined)
                : real.get(key),
    })
    const { session } = await page()
    expect(session.state).toBe('locked')
    expect(session.contents).toBeNull()
})

it('prunes the Steam cache and clears the entry when the open vault is removed', async () => {
    const prune = vi.spyOn(steamCache, 'pruneCollections')
    const { session } = await createdUnder('never')
    const id = session.vault?.id ?? ''

    await session.remove(id)
    await vi.waitFor(async () => expect(await readKept()).toBeUndefined())
    expect(prune.mock.calls.some(([, keep]) => keep('any') === false)).toBe(
        true,
    )
    expect(session.state).toBe('new')
    expect(await deviceStore.list()).toEqual([])
    prune.mockRestore()
})
