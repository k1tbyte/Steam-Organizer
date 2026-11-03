import { deviceStore, steamCache } from '@so/core'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { installSessionArea, sessionArea } from '#core'

import type { LockAfter } from '../model'
import {
    readActive,
    readKept,
    removeKept,
    writeActive,
    writeKept,
} from '../services/device/keptEntry'
import { freshDevice, page, restart } from '../testing/sessionPages'

const PASSWORD = 'correct horse'
const MINUTE = 60_000

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
    vi.useFakeTimers({ toFake: ['Date'] })
    await freshDevice()
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
    const real = sessionArea()
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

it('drops the copy on disk before the live entry at a Never lock, so a page loading meanwhile cannot restore from it', async () => {
    const { session } = await createdUnder('never')
    const real = sessionArea()
    let diskAtRemoval: boolean | undefined
    installSessionArea({
        ...real,
        async remove(key) {
            if (key === 'so:kept')
                diskAtRemoval = (await deviceStore.list()).some(
                    ({ kept }) => kept,
                )
            return real.remove(key)
        },
    })
    session.lock()
    await vi.waitFor(async () => expect(await readKept()).toBeUndefined())
    expect(diskAtRemoval).toBe(false)
})

it('takes the vault another page opened when the one a restore began with was locked meanwhile', async () => {
    const { session: first } = await createdUnder('15m')
    first.lock()
    await first.create('Other', PASSWORD)
    first.open()
    await vi.waitFor(async () =>
        expect((await readKept())?.vault).toBe(first.vault?.id),
    )
    const other = await readKept()
    first.lock()
    await vi.waitFor(async () => expect(await readKept()).toBeUndefined())
    const main = first.vaults.find(({ name }) => name === 'Main')?.id
    expect(await first.unlock({ method: 'pw', password: PASSWORD }, main)).toBe(
        'opened',
    )
    first.open()
    await vi.waitFor(async () => expect((await readKept())?.vault).toBe(main))

    // The restore reads Main's entry; by its second look Main was locked and Other opened.
    const real = sessionArea()
    let reads = 0
    installSessionArea({
        ...real,
        get: (key) =>
            key === 'so:kept' && ++reads > 1
                ? Promise.resolve(JSON.stringify(other))
                : real.get(key),
    })
    const { session } = await page()
    await vi.waitFor(() => expect(session.vault?.name).toBe('Other'))
    expect(session.state).toBe('unlocked')
})

it('refuses a password unlock that began before a lock', async () => {
    const { session: first } = await createdUnder('15m')
    const entry = await readKept()
    first.lock()
    await vi.waitFor(async () => expect(await readKept()).toBeUndefined())

    const { session } = await page()
    const pending = session.unlock({ method: 'pw', password: PASSWORD })
    // Another page unlocks and locks while the PBKDF2 runs.
    await writeActive(Date.now())
    await writeKept(entry as NonNullable<typeof entry>)
    await vi.waitFor(() => expect(session.state).toBe('unlocked'))
    await removeKept()
    await vi.waitFor(() => expect(session.state).toBe('locked'))

    expect(await pending).not.toBe('opened')
    expect(session.state).toBe('locked')
})

it('locks a restore from disk whose copy a lock removed while it opened', async () => {
    const { session: first } = await createdUnder('never')
    const id = first.vault?.id ?? ''
    restart()
    const list = deviceStore.list.bind(deviceStore)
    const spy = vi
        .spyOn(deviceStore, 'list')
        .mockImplementationOnce(async () => {
            const found = await list()
            // Another page restored the same copy and locked before this one finished opening it.
            await deviceStore.update(id, ({ kept: _, ...rest }) => rest)
            return found
        })
    const { session } = await page()
    expect(session.state).toBe('locked')
    expect(session.contents).toBeNull()
    spy.mockRestore()
})
