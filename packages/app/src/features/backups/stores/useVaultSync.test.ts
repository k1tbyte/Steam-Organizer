import 'fake-indexeddb/auto'

import {
    type DriveFile,
    listBackups,
    listCopies,
    readCopy,
    type SealedRecord,
    sealRecord,
} from '@so/core'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, expect, it, vi } from 'vitest'

import { useVaultSession } from '#features/vault'

import type { SyncNotice } from '../model'
import { useVaultSync } from './useVaultSync'

const PASSWORD = 'correct horse'

/** One Drive for every device, its version moving with each write; `failing` makes the next download throw. */
const drive = vi.hoisted(() => {
    const files: (DriveFile & { body: string })[] = []
    let written = 0
    const find = (id: string) => files.find((file) => file.id === id)
    return {
        files,
        /** Made reactive by the mock below, as the real connection is. */
        connection: { email: 'alex@x.com' },
        failing: false,
        /** Holds downloads until it settles. */
        gate: Promise.resolve() as Promise<unknown>,
        api: {
            async list(properties: Record<string, string>) {
                return files.filter((file) =>
                    Object.entries(properties).every(
                        ([key, value]) => file.appProperties[key] === value,
                    ),
                )
            },
            async create(
                name: string,
                appProperties: Record<string, string>,
                body: string,
            ) {
                written++
                const file = {
                    id: `f${written}`,
                    name,
                    size: body.length,
                    createdTime: written,
                    modifiedTime: written,
                    version: String(written),
                    appProperties,
                    body,
                }
                files.push(file)
                return file
            },
            async update(
                id: string,
                appProperties: Record<string, string>,
                body: string,
            ) {
                written++
                const file = find(id)
                if (!file) throw new Error('not found')
                Object.assign(file, {
                    body,
                    size: body.length,
                    modifiedTime: written,
                    version: String(written),
                    appProperties: { ...file.appProperties, ...appProperties },
                })
                return file
            },
            async download(id: string) {
                await drive.gate
                if (drive.failing) throw new Error('download failed')
                return find(id)?.body ?? ''
            },
            async remove(id: string) {
                const at = files.findIndex((file) => file.id === id)
                if (at >= 0) files.splice(at, 1)
            },
        },
    }
})

vi.mock('#features/drive', async () => {
    const { computed, reactive } = await import('vue')
    drive.connection = reactive(drive.connection)
    return {
        useDrive: () => ({
            account: computed(() => ({
                name: 'Alex',
                email: drive.connection.email,
            })),
            state: computed(() => 'connected'),
            run: <T>(work: (api: typeof drive.api) => Promise<T>) =>
                work(drive.api),
        }),
    }
})

beforeEach(async () => {
    drive.files.length = 0
    drive.connection.email = 'alex@x.com'
    drive.failing = false
    drive.gate = Promise.resolve()
    await new Promise((resolve) => {
        indexedDB.deleteDatabase('steam-organizer').onsuccess = resolve
    })
})

/** A device: its own Pinia, so its own session and engine. */
function device() {
    setActivePinia(createPinia())
    const session = useVaultSession()
    const engine = useVaultSync()
    const notices: SyncNotice[] = []
    engine.onNotice((notice) => notices.push(notice))
    return { session, engine, notices }
}

type Device = ReturnType<typeof device>

async function write(on: Device, id: string, updatedAt: number, n: number) {
    await on.session.transact(async (_, key) => [
        await sealRecord(key, { id, updatedAt, data: { n } }),
    ])
}

const tomb = (id: string, updatedAt: number): SealedRecord => ({
    id,
    updatedAt,
    deleted: true,
})

const dataOf = (on: Device) =>
    Object.fromEntries(on.session.contents?.data ?? [])

/** Device A creates a synced vault and pushes it; device B joins through its copy, as Restore does. */
async function twoDevices() {
    const a = device()
    await a.session.create('Main', PASSWORD, true)
    await write(a, 'one', 1, 1)
    await a.engine.sync()
    const b = device()
    const [copy] = await listCopies(drive.api, a.session.vault?.id)
    if (!copy) throw new Error('nothing pushed')
    expect(
        await b.session.adopt(
            'Main',
            await readCopy(drive.api, copy.id),
            PASSWORD,
            undefined,
            {
                account: drive.connection.email,
                copyId: copy.id,
                version: copy.version,
            },
        ),
    ).toBe('opened')
    return { a, b, vaultId: copy.vaultId }
}

it('pushes a new synced vault once and then only marks it synced', async () => {
    const a = device()
    await a.session.create('Main', PASSWORD, true)
    expect(a.session.vault?.sync?.pending).toBe(true)
    await a.engine.sync()
    expect(drive.files).toHaveLength(1)
    expect(drive.files[0]?.appProperties).toMatchObject({
        type: 'vault',
        vaultName: 'Main',
    })
    expect(a.session.vault?.sync?.pending).toBe(false)
    expect(a.session.vault?.sync?.syncedAt).not.toBeNull()

    const version = drive.files[0]?.version
    await a.engine.sync()
    expect(drive.files[0]?.version).toBe(version)
})

it('carries edits and deletions between two devices, both ways', async () => {
    const { a, b } = await twoDevices()
    expect(dataOf(b)).toEqual({ one: { n: 1 } })

    await write(a, 'two', 2, 2)
    await write(b, 'three', 3, 3)
    await a.engine.sync()
    await b.engine.sync()
    await a.engine.sync()
    expect(dataOf(a)).toEqual({ one: { n: 1 }, two: { n: 2 }, three: { n: 3 } })
    expect(dataOf(b)).toEqual(dataOf(a))

    await b.session.transact(async () => [tomb('one', 4)])
    await b.engine.sync()
    await a.engine.sync()
    expect(dataOf(a)).toEqual({ two: { n: 2 }, three: { n: 3 } })
    expect(a.session.vault?.sync?.pending).toBe(false)
    expect(b.session.vault?.sync?.pending).toBe(false)
})

it('adopts a password changed on the other device at the next sync', async () => {
    const { a, b, vaultId } = await twoDevices()
    expect(await a.session.changePassword(PASSWORD, 'new one')).toBe(true)
    await a.engine.sync()
    await b.engine.sync()
    expect(await b.session.verify({ method: 'pw', password: 'new one' })).toBe(
        true,
    )
    const stored = b.session.vaults.find(({ id }) => id === vaultId)
    expect(stored?.file.slots.changedAt).toBeGreaterThan(0)
})

it('keeps the vault on this device when its copy is gone, and says so once', async () => {
    const { a } = await twoDevices()
    drive.files.length = 0
    await write(a, 'two', 2, 2)
    await a.engine.sync()
    expect(a.session.vault?.sync).toBeNull()
    expect(a.notices).toEqual([{ kind: 'gone', vaultName: 'Main' }])
    expect(drive.files).toHaveLength(0)
    expect(dataOf(a)).toEqual({ one: { n: 1 }, two: { n: 2 } })
})

it('treats another Google account as the copy gone', async () => {
    const { a } = await twoDevices()
    drive.connection.email = 'sam@x.com'
    await a.engine.sync()
    expect(a.session.vault?.sync).toBeNull()
    expect(a.notices).toEqual([{ kind: 'gone', vaultName: 'Main' }])
})

it('never merges a copy downloaded for the Google account switched away from', async () => {
    const { a, b } = await twoDevices()
    await write(b, 'two', 2, 2)
    await b.engine.sync()
    let release = () => {}
    drive.gate = new Promise<void>((done) => {
        release = done
    })
    const syncing = a.engine.sync()
    await vi.waitFor(() => expect(a.engine.running).toBe(true))
    drive.connection.email = 'sam@x.com'
    release()
    await syncing
    expect(dataOf(a)).toEqual({ one: { n: 1 } })
})

it('tells the first failure of a streak, never writes over an unread copy, and clears on success', async () => {
    const { a, b } = await twoDevices()
    await write(b, 'two', 2, 2)
    await b.engine.sync()
    const version = drive.files[0]?.version
    await write(a, 'three', 3, 3)

    drive.failing = true
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await a.engine.sync()
    await a.engine.sync()
    expect(a.notices).toEqual([{ kind: 'failed' }])
    expect(a.engine.failure).toBeInstanceOf(Error)
    expect(drive.files[0]?.version).toBe(version)

    drive.failing = false
    await a.engine.sync()
    expect(a.engine.failure).toBeNull()
    expect(dataOf(a)).toEqual({ one: { n: 1 }, two: { n: 2 }, three: { n: 3 } })
})

it('pushes what a lock left over the copy it merged, and not over a newer one', async () => {
    const { a, b } = await twoDevices()
    a.session.onLocked((snapshot) => void a.engine.flush(snapshot))
    let flushed: Promise<unknown> = Promise.resolve()
    a.session.onLocked((snapshot) => {
        flushed = snapshot.then(
            () => new Promise((done) => setTimeout(done, 50)),
        )
    })
    a.session.onBeforeLock(() => void write(a, 'draft', 5, 5))
    a.session.lock()
    await flushed
    await vi.waitFor(() => expect(a.session.vaults[0]?.sync?.revision).toBe(2))
    await b.engine.sync()
    expect(dataOf(b)).toMatchObject({ draft: { n: 5 } })

    // B pushed since: B's newer copy is never overwritten by A's locked file.
    await write(b, 'later', 6, 6)
    await b.engine.sync()
    const version = drive.files[0]?.version
    expect(await a.session.unlock({ method: 'pw', password: PASSWORD })).toBe(
        'opened',
    )
    a.session.open()
    await write(a, 'locked-out', 7, 7)
    a.session.lock()
    await flushed
    expect(drive.files[0]?.version).toBe(version)
})

it('saves an auto backup at most once a day after a change, keeping the newest ten', async () => {
    const { a, vaultId } = await twoDevices()
    await a.engine.backUpIfDue()
    await a.engine.backUpIfDue()
    let backups = await listBackups(drive.api, vaultId)
    expect(backups.map(({ kind }) => kind)).toEqual(['auto'])

    // Twelve old auto backups, none due (nothing changed since), and a manual one: the newest ten autos stay.
    drive.files.splice(
        drive.files.findIndex(({ id }) => id === backups[0]?.id),
        1,
    )
    for (let day = 0; day < 12; day++)
        drive.files.push({
            id: `old${day}`,
            name: 'backup.json',
            size: 1,
            createdTime: day,
            modifiedTime: day,
            version: '1',
            appProperties: { type: 'backup', vault: vaultId, kind: 'auto' },
            body: '',
        })
    drive.files.push({
        id: 'manual',
        name: 'backup.json',
        size: 1,
        createdTime: 0,
        modifiedTime: 0,
        version: '1',
        appProperties: { type: 'backup', vault: vaultId, kind: 'manual' },
        body: '',
    })
    await a.engine.backUpIfDue()
    backups = await listBackups(drive.api, vaultId)
    expect(backups.filter(({ kind }) => kind === 'auto')).toHaveLength(10)
    expect(backups.some(({ id }) => id === 'manual')).toBe(true)
    expect(backups.map(({ id }) => id)).not.toContain('old1')
    expect(backups.map(({ id }) => id)).toContain('old2')
})
