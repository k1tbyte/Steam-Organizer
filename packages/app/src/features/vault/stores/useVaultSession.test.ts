import 'fake-indexeddb/auto'

import {
    readRecords,
    type SealedRecord,
    sealRecord,
    steamCache,
    type VaultKey,
    vaultStore,
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
