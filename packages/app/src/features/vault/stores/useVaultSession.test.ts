import 'fake-indexeddb/auto'

import {
    createVault,
    readRecords,
    changePassword as rewrap,
    type SealedRecord,
    sealRecord,
    steamCache,
    type VaultFile,
    type VaultKey,
    vaultStore,
    writeRecords,
} from '@so/core'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, expect, it } from 'vitest'

import { useVaultSession } from './useVaultSession'

const PASSWORD = 'correct horse'

// A fresh Pinia is a reload: only what IndexedDB kept survives it.
async function reload() {
    setActivePinia(createPinia())
    const session = useVaultSession()
    await session.load()
    return session
}

beforeEach(async () => {
    await new Promise((resolve) => {
        indexedDB.deleteDatabase('steam-organizer').onsuccess = resolve
    })
})

it('creates a vault that a reload finds locked and the password opens', async () => {
    const first = await reload()
    expect(first.state).toBe('new')
    await first.create('Main', PASSWORD)
    expect(first.state).toBe('unlocked')

    const session = await reload()
    expect(session.state).toBe('locked')
    expect(session.vaults.map((vault) => vault.name)).toEqual(['Main'])
    expect(await session.unlock({ method: 'pw', password: 'nope' })).toBe(
        'wrong',
    )
    expect(await session.unlock({ method: 'pin', pin: '123456' })).toBe('wrong')
    expect(await session.unlock({ method: 'pw', password: PASSWORD })).toBe(
        'opened',
    )
    // The state turns once the opening animation ends.
    expect(session.state).toBe('locked')
    session.open()
    expect(session.state).toBe('unlocked')
})

it('changes the master password of the open vault', async () => {
    const session = await reload()
    await session.create('Main', PASSWORD)
    expect(await session.changePassword('nope', 'new one')).toBe(false)
    expect(await session.changePassword(PASSWORD, 'new one')).toBe(true)
    expect(await session.verify({ method: 'pw', password: 'new one' })).toBe(
        true,
    )

    const reloaded = await reload()
    expect(await reloaded.unlock({ method: 'pw', password: PASSWORD })).toBe(
        'wrong',
    )
    expect(await reloaded.unlock({ method: 'pw', password: 'new one' })).toBe(
        'opened',
    )
})

it('snapshots after the writes queued before it; the key still reads that file after a password change', async () => {
    const session = await reload()
    await session.create('Main', PASSWORD)
    void session.transact(async (_, key) => [
        await sealRecord(key, { id: 'a', updatedAt: 1, data: { n: 1 } }),
    ])
    const before = await session.snapshot()
    expect(before?.contents.data.get('a')).toEqual({ n: 1 })
    expect(session.vault).toEqual({
        id: before?.file.id,
        name: 'Main',
        home: 'device',
        sync: null,
    })

    expect(await session.changePassword(PASSWORD, 'new one')).toBe(true)
    let read: SealedRecord[] = []
    await session.transact(async (_, key) => {
        if (before) read = await readRecords(key, before.file)
        return []
    })
    expect(read.map(({ id }) => id)).toEqual(['a'])
})

it('adopts a vault file from elsewhere with the password it was made with, and keeps it', async () => {
    const source = await reload()
    await source.create('Main', PASSWORD)
    await source.transact(async (_, key) => [
        await sealRecord(key, { id: 'a', updatedAt: 1, data: { n: 1 } }),
    ])
    const backup = await source.snapshot()
    await new Promise((resolve) => {
        indexedDB.deleteDatabase('steam-organizer').onsuccess = resolve
    })

    const session = await reload()
    if (!backup) throw new Error('no snapshot')
    expect(await session.adopt('Restored', backup.file, 'nope')).toBe('wrong')
    const given = new AbortController()
    given.abort()
    await expect(
        session.adopt('Restored', backup.file, PASSWORD, given.signal),
    ).rejects.toThrow()
    expect(session.state).toBe('new')
    expect(await vaultStore.list()).toEqual([])
    expect(await session.adopt('Restored', backup.file, PASSWORD)).toBe(
        'opened',
    )
    expect(session.state).toBe('unlocked')
    expect(session.contents?.data.get('a')).toEqual({ n: 1 })

    const reloaded = await reload()
    expect(reloaded.vaults.map(({ id, name }) => [id, name])).toEqual([
        [backup.file.id, 'Restored'],
    ])
})

it('renames the open vault on this device and remembers it as the last opened', async () => {
    const session = await reload()
    await session.create('Main', PASSWORD)
    const id = session.vault?.id
    expect(session.lastVaultId).toBe(id)
    await session.rename('Farm')
    expect(session.vault?.name).toBe('Farm')

    const reloaded = await reload()
    expect(reloaded.vaults.map(({ id, name }) => [id, name])).toEqual([
        [id, 'Farm'],
    ])
})

it('removes a vault after the writes queued before it; the open one drops its key', async () => {
    const session = await reload()
    await session.create('Farm', PASSWORD)
    const farm = session.vault?.id ?? ''
    await session.create('Main', PASSWORD)
    const main = session.vault?.id ?? ''

    void session.transact(async (_, key) => [
        await sealRecord(key, { id: 'a', updatedAt: 1, data: { n: 1 } }),
    ])
    await session.remove(main)
    expect(session.state).toBe('locked')
    expect(session.vault).toBeNull()
    await session.transact(async (_, key) => [
        await sealRecord(key, { id: 'b', updatedAt: 1, data: { n: 2 } }),
    ])
    expect((await vaultStore.list()).map(({ id }) => id)).toEqual([farm])

    await session.remove(farm)
    expect(session.state).toBe('new')
    expect(await vaultStore.list()).toEqual([])
})

it('never opens a vault removed while its password was being checked', async () => {
    const first = await reload()
    await first.create('Main', PASSWORD)
    const id = first.vault?.id ?? ''

    const session = await reload()
    const unlocking = session.unlock({ method: 'pw', password: PASSWORD }, id)
    await session.remove(id)
    expect(await unlocking).toBe('unreadable')
    expect(session.vault).toBeNull()
    expect(await vaultStore.list()).toEqual([])
})

it('never lets a late unlock replace a vault another flow opened', async () => {
    const first = await reload()
    await first.create('Farm', PASSWORD)
    const farm = first.vault?.id ?? ''
    const session = await reload()
    await session.create('Main', PASSWORD)
    expect(
        await session.unlock({ method: 'pw', password: PASSWORD }, farm),
    ).toBe('unreadable')
    expect(session.vault?.name).toBe('Main')
})

it("replaces the open vault's records with another copy's, tombstoning the rest", async () => {
    const session = await reload()
    await session.create('Main', PASSWORD)
    await session.transact(async (_, key) => [
        await sealRecord(key, { id: 'a', updatedAt: 1, data: { n: 1 } }),
    ])
    const copy = await session.snapshot()
    await session.transact(async (_, key) => [
        await sealRecord(key, { id: 'a', updatedAt: 2, data: { n: 2 } }),
        await sealRecord(key, { id: 'b', updatedAt: 2, data: { n: 3 } }),
    ])
    const records =
        copy && (await session.withKey((key) => readRecords(key, copy.file)))
    const restoredAt = Date.now()
    await session.replaceRecords(records ?? [])
    expect([...(session.contents?.data ?? [])]).toEqual([['a', { n: 1 }]])
    expect(session.contents?.records[0]?.updatedAt).toBeGreaterThanOrEqual(
        restoredAt,
    )
    expect(
        session.contents?.records.find(({ id }) => id === 'b'),
    ).toMatchObject({ deleted: true })
})

it('lets drafts flush before the key drops', async () => {
    const session = await reload()
    await session.create('Main', PASSWORD)
    let open: unknown = null
    session.onBeforeLock(() => {
        open = session.contents
    })
    session.lock()
    expect(open).not.toBeNull()
    expect(session.contents).toBeNull()
})

it('keeps the key dropped when the vault locks during a password change', async () => {
    const session = await reload()
    await session.create('Main', PASSWORD)
    const changing = session.changePassword(PASSWORD, 'new one')
    session.lock()
    expect(await changing).toBe(true)
    expect(session.state).toBe('locked')
    // With no vault open, verify falls back to the demo check.
    expect(await session.verify({ method: 'pw', password: 'new one' })).toBe(
        false,
    )
    expect(await session.unlock({ method: 'pw', password: PASSWORD })).toBe(
        'wrong',
    )
    expect(await session.unlock({ method: 'pw', password: 'new one' })).toBe(
        'opened',
    )
})

it('opens one record secret on demand', async () => {
    const session = await reload()
    await session.create('Main', PASSWORD)
    await session.transact(async (_contents, key) => [
        await sealRecord(key, {
            id: 'r1',
            updatedAt: 1,
            data: {},
            secret: { password: 'pw' },
        }),
    ])
    expect(await session.secretOf('r1')).toEqual({ password: 'pw' })
    expect(await session.secretOf('missing')).toBeUndefined()
})

it('drops on unlock the Steam cache of accounts the vault no longer has', async () => {
    const session = await reload()
    await session.create('Main', PASSWORD)
    const entry = { games: [], friends: null, fetchedAt: 1 }
    let sealedWith: VaultKey | undefined
    await session.transact(async (_contents, key) => {
        sealedWith = key
        for (const id of ['r1', 'gone'])
            await steamCache.putCollection(key, id, entry, () => true)
        return [await sealRecord(key, { id: 'r1', updatedAt: 1, data: {} })]
    })
    const reloaded = await reload()
    const dropped = new Promise((resolve) => {
        const stop = steamCache.onCollection((id) => {
            stop()
            resolve(id)
        })
    })
    await reloaded.unlock({ method: 'pw', password: PASSWORD })
    expect(await dropped).toBe('gone')
    const key = sealedWith as VaultKey
    expect(await steamCache.collection(key, 'r1')).toEqual(entry)
    expect(await steamCache.collection(key, 'gone')).toBeNull()
})

const COPY = { account: 'alex@x.com', copyId: 'f1', version: '1' }

/** A linked vault, its first push acknowledged, with record `a`. */
async function synced() {
    const session = await reload()
    await session.create('Main', PASSWORD, true)
    await session.transact(async (_, key) => [
        await sealRecord(key, { id: 'a', updatedAt: 1, data: { n: 1 } }),
    ])
    const pushed = await merged(session, null)
    if (!pushed) throw new Error('not linked')
    expect(await session.markSynced(pushed.receipt, COPY)).toBe(true)
    return { session, file: pushed.file, id: pushed.file.id }
}

/** `file` with `records` written over it, as another device would push it. */
async function copyWith(
    session: ReturnType<typeof useVaultSession>,
    file: VaultFile,
    records: (key: VaultKey) => Promise<SealedRecord[]>,
) {
    const copy = await session.withKey(async (key) =>
        writeRecords(key, file, [
            ...(await readRecords(key, file)),
            ...(await records(key)),
        ]),
    )
    if (!copy) throw new Error('no vault open')
    return copy
}

const stored = async (id: string) => vaultStore.get(id)

async function merged(
    session: ReturnType<typeof useVaultSession>,
    copy: VaultFile | null,
) {
    const result = await session.mergeCopy(copy)
    if (!result) throw new Error('not linked')
    return result
}

it('moves the revision with every change to the file, but not with a rename', async () => {
    const session = await reload()
    await session.create('Main', PASSWORD)
    const id = session.vault?.id ?? ''
    expect((await stored(id))?.revision).toBe(0)
    await session.transact(async (_, key) => [
        await sealRecord(key, { id: 'a', updatedAt: 1, data: { n: 1 } }),
    ])
    expect((await stored(id))?.revision).toBe(1)
    await session.rename('Farm')
    expect((await stored(id))?.revision).toBe(1)
    await session.changePassword(PASSWORD, 'new one')
    expect((await stored(id))?.revision).toBe(2)
    expect(session.vault?.sync).toBeNull()
})

it('creates a linked vault with its first push pending', async () => {
    const session = await reload()
    await session.create('Main', PASSWORD, true)
    expect(session.vault?.sync).toEqual({ syncedAt: null, pending: true })
    const pushed = await merged(session, null)
    expect(pushed?.push).toBe(true)
    await session.markSynced(pushed.receipt, COPY)
    expect(session.vault?.sync?.pending).toBe(false)
    expect((await stored(pushed.file.id))?.sync).toMatchObject({
        ...COPY,
        revision: 0,
    })
})

it('takes a newer record from the copy without asking for a push', async () => {
    const { session, file } = await synced()
    const copy = await copyWith(session, file, async (key) => [
        await sealRecord(key, { id: 'a', updatedAt: 2, data: { n: 2 } }),
    ])
    const result = await merged(session, copy)
    expect(result.push).toBe(false)
    expect(session.contents?.data.get('a')).toEqual({ n: 2 })
    // The merge wrote the file: the receipt carries that revision, so marking it leaves nothing pending.
    await session.markSynced(result.receipt, { ...COPY, version: '2' })
    expect(session.vault?.sync?.pending).toBe(false)
})

it('asks for a push when this device has a record the copy lacks', async () => {
    const { session, file } = await synced()
    await session.transact(async (_, key) => [
        await sealRecord(key, { id: 'b', updatedAt: 3, data: { n: 3 } }),
    ])
    const result = await merged(session, file)
    expect(result.push).toBe(true)
    expect(session.contents?.data.get('b')).toEqual({ n: 3 })
})

it("adopts the copy's newer slots: after a reload the old password is refused", async () => {
    const { session, file, id } = await synced()
    const copy = await rewrap(file, PASSWORD, 'new one')
    expect((await session.mergeCopy(copy))?.push).toBe(false)

    const reloaded = await reload()
    expect(
        await reloaded.unlock({ method: 'pw', password: PASSWORD }, id),
    ).toBe('wrong')
    expect(
        await reloaded.unlock({ method: 'pw', password: 'new one' }, id),
    ).toBe('opened')
})

it('writes nothing for a copy the key cannot open', async () => {
    const { session, file, id } = await synced()
    const before = await stored(id)
    const other = await createVault(PASSWORD)
    const foreign = { ...other.file, id }
    await expect(session.mergeCopy(foreign)).rejects.toThrow()
    await expect(session.mergeCopy({ ...file, id: 'other' })).rejects.toThrow()
    expect(await stored(id)).toEqual(before)
})

it('keeps a write after the receipt pending', async () => {
    const { session } = await synced()
    await session.transact(async (_, key) => [
        await sealRecord(key, { id: 'b', updatedAt: 3, data: { n: 3 } }),
    ])
    const pushing = await merged(session, null)
    await session.transact(async (_, key) => [
        await sealRecord(key, { id: 'c', updatedAt: 4, data: { n: 4 } }),
    ])
    expect(await session.markSynced(pushing.receipt, COPY)).toBe(true)
    expect(session.vault?.sync?.pending).toBe(true)
})

it('refuses a receipt for a vault removed or linked again since', async () => {
    const { session, id } = await synced()
    const relinked = await merged(session, null)
    await session.unlink()
    expect(session.vault?.sync).toBeNull()
    expect(await session.markSynced(relinked.receipt, COPY)).toBe(false)
    await session.link()
    expect(await session.markSynced(relinked.receipt, COPY)).toBe(false)
    expect(session.vault?.sync).toEqual({ syncedAt: null, pending: true })

    const removed = await merged(session, null)
    await session.remove(id)
    expect(await session.markSynced(removed.receipt, COPY)).toBe(false)
    expect(await stored(id)).toBeUndefined()
})

it('hands a lock the file with a draft flushed at that lock', async () => {
    const { session } = await synced()
    let key: VaultKey | undefined
    await session.withKey(async (held) => {
        key = held
    })
    let left: Promise<unknown> = Promise.resolve()
    // The engine registers first; the draft still lands before the snapshot is read.
    session.onLocked((snapshot) => {
        left = snapshot
    })
    session.onBeforeLock(() => {
        void session.transact(async (_, held) => [
            await sealRecord(held, { id: 'draft', updatedAt: 5, data: {} }),
        ])
    })
    session.lock()
    const snapshot = (await left) as { file: VaultFile } | undefined
    if (!snapshot || !key) throw new Error('no snapshot')
    const records = await readRecords(key, snapshot.file)
    expect(records.map(({ id }) => id)).toContain('draft')
})

it('counts a recovery slot added to an adopted copy as a change to push', async () => {
    const source = await reload()
    await source.create('Main', PASSWORD)
    const made = await source.snapshot()
    if (!made) throw new Error('no snapshot')
    await new Promise((resolve) => {
        indexedDB.deleteDatabase('steam-organizer').onsuccess = resolve
    })
    const session = await reload()
    const { password } = made.file.slots
    expect(
        await session.adopt(
            'Main',
            { ...made.file, slots: { password } },
            PASSWORD,
            undefined,
            COPY,
        ),
    ).toBe('opened')
    expect(session.vault?.sync?.pending).toBe(true)
    const pushed = await merged(session, made.file)
    expect(pushed?.push).toBe(true)
    expect(pushed?.file.slots.recovery).toBeDefined()

    const plain = await reload()
    expect(
        await plain.adopt('Main', made.file, PASSWORD, undefined, COPY),
    ).toBe('opened')
    expect(plain.vault?.sync?.pending).toBe(false)
})

it("unlocks with the copy's newer password and keeps it", async () => {
    const { file, id } = await synced()
    const copy = await rewrap(file, PASSWORD, 'new one')
    const other = await createVault('new one')

    const session = await reload()
    const typed = { method: 'pw', password: 'new one' } as const
    expect(await session.unlock(typed, id)).toBe('wrong')
    expect(await session.unlock(typed, id, { ...other.file, id })).toBe('wrong')
    expect(await session.unlock(typed, id, copy)).toBe('opened')
    expect(session.contents?.data.get('a')).toEqual({ n: 1 })

    const reloaded = await reload()
    expect(await reloaded.unlock(typed, id)).toBe('opened')
})
