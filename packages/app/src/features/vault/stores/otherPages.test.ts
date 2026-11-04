import {
    createVault,
    type LiveRecord,
    sealRecord,
    updateData,
    vaultStore,
} from '@so/core'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { readKept } from '../services/device/keptEntry'
import { freshDevice, type Page, page } from '../testing/sessionPages'

const PASSWORD = 'correct horse'

// The app page that makes the changes, and a long-lived page (the vault host) that restored its session.
async function twoPages() {
    const app = await page()
    await app.policy.setLockAfter('15m')
    await app.session.create('Main', PASSWORD)
    await vi.waitFor(async () => expect(await readKept()).toBeDefined())
    await write(app, 'one', { n: 1 })
    await write(app, 'two', { n: 1 })
    const host = await page()
    expect(host.session.state).toBe('unlocked')
    return { app, host, id: app.session.vault?.id as string }
}

const write = (on: Page, id: string, data: object, secret?: object) =>
    on.session.transact(async (_, key) => [
        await sealRecord(key, { id, updatedAt: Date.now(), data, secret }),
    ])

const dataOf = (on: Page, id: string) => on.session.contents?.data.get(id)

async function receiptOf(on: Page) {
    const merged = await on.session.mergeCopy(null)
    if (!merged) throw new Error('Not linked')
    return merged.receipt
}

beforeEach(async () => {
    await freshDevice()
})

afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
})

it("lands two pages' writes made at once, each on the latest file", async () => {
    const { app, host, id } = await twoPages()
    const revision = (await vaultStore.get(id))?.revision ?? 0
    await Promise.all([
        write(app, 'one', { n: 2 }),
        write(host, 'two', { n: 2 }),
    ])
    for (const on of [app, host])
        await vi.waitFor(() => {
            expect(dataOf(on, 'one')).toEqual({ n: 2 })
            expect(dataOf(on, 'two')).toEqual({ n: 2 })
        })
    expect((await vaultStore.get(id))?.revision).toBe(revision + 2)
})

it('takes in an edit and a deletion another page made, without a call', async () => {
    const { app, host } = await twoPages()
    await write(app, 'one', { n: 2 })
    await app.session.transact(async () => [
        { id: 'two', updatedAt: Date.now() + 1, deleted: true },
    ])
    await vi.waitFor(() => {
        expect(dataOf(host, 'one')).toEqual({ n: 2 })
        expect(host.session.contents?.data.has('two')).toBe(false)
    })
    expect(host.session.state).toBe('unlocked')
})

it('does not open the records again while the stored file is the one held', async () => {
    const { app, host } = await twoPages()
    const before = host.session.contents
    await host.session.refreshOpen()
    expect(host.session.contents).toBe(before)

    await app.session.rename('Work')
    await vi.waitFor(() => expect(host.session.vault?.name).toBe('Work'))
    expect(host.session.contents).toBe(before)
})

it("keeps a held record key through another page's data change, and drops it once the secret changed", async () => {
    const { app, host } = await twoPages()
    await write(app, 'one', { n: 2 }, { s: 1 })
    await vi.waitFor(() => expect(dataOf(host, 'one')).toEqual({ n: 2 }))
    const key = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt'],
    )
    host.session.keyHolder('one')(key)

    await app.session.transact(async (contents, vaultKey) => {
        const record = contents.records.find(({ id }) => id === 'one')
        return [
            await updateData(
                vaultKey,
                record as LiveRecord,
                { n: 3 },
                Date.now(),
            ),
        ]
    })
    await vi.waitFor(() => expect(dataOf(host, 'one')).toEqual({ n: 3 }))
    expect(host.session.keyOf('one')).toBe(key)

    await write(app, 'one', { n: 4 }, { s: 2 })
    await vi.waitFor(() => expect(dataOf(host, 'one')).toEqual({ n: 4 }))
    expect(host.session.keyOf('one')).toBeUndefined()
})

it('locks a page whose vault another page removed from the disk, and drops it from the list', async () => {
    const { host, id } = await twoPages()
    // Straight from the store: no lock of the kept entry and no message reach the host first.
    await vaultStore.remove(id)
    await host.session.refreshOpen()
    // Locked, and the list no longer holds it: no vault left.
    expect(host.session.state).toBe('new')
    expect(host.session.contents).toBeNull()
})

it('locks a page whose held key no longer opens the stored file', async () => {
    // The restore it tries after the lock reports the file it cannot open.
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { host, id } = await twoPages()
    const stored = await vaultStore.get(id)
    const other = await createVault('another password')
    await vaultStore.put({
        ...(stored as NonNullable<typeof stored>),
        file: { ...other.file, id },
        revision: (stored?.revision ?? 0) + 1,
    })
    await host.session.refreshOpen()
    expect(host.session.state).toBe('locked')
})

it("takes in another page's edit before its own write, a rename or a record", async () => {
    const { app, host } = await twoPages()
    const key = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt'],
    )
    await write(app, 'one', { n: 2 }, { s: 1 })
    await host.session.refreshOpen()
    host.session.keyHolder('one')(key)
    // The host's writes wait on the app's lock, ahead of the message the app's write sends.
    await Promise.all([
        write(app, 'one', { n: 3 }, { s: 2 }),
        host.session.rename('Work'),
    ])
    expect(dataOf(host, 'one')).toEqual({ n: 3 })
    expect(host.session.keyOf('one')).toBeUndefined()

    await Promise.all([write(app, 'two', { n: 4 }), write(host, 'three', {})])
    await host.session.refreshOpen()
    expect(dataOf(host, 'two')).toEqual({ n: 4 })
})

it("seals new account locks to another page's recovery pair", async () => {
    const { host, id } = await twoPages()
    const before = await host.session.withKey(async (key) => key.recovery)
    const stored = await vaultStore.get(id)
    if (!stored) throw new Error('stored')
    const other = await createVault('another password')
    const recovery = other.file.slots.recovery
    await vaultStore.put({
        ...stored,
        file: { ...stored.file, slots: { ...stored.file.slots, recovery } },
        revision: (stored.revision ?? 0) + 1,
    })
    await host.session.refreshOpen()
    const after = await host.session.withKey(async (key) => key.recovery)
    expect(after).toBeDefined()
    expect(after).not.toBe(before)
    expect(host.session.contents?.data.get('one')).toEqual({ n: 1 })
})

it('refuses a sync receipt read before another page linked the vault again to the same copy', async () => {
    const app = await page()
    await app.policy.setLockAfter('15m')
    await app.session.create('Main', PASSWORD, true)
    await vi.waitFor(async () => expect(await readKept()).toBeDefined())
    const at = { account: 'alex@x.com', copyId: 'c1', version: '1' }
    expect(await app.session.markSynced(await receiptOf(app), at)).toBe(true)
    const host = await page()
    await write(app, 'one', { n: 1 })
    const late = await receiptOf(host)
    // Straight to the store, as a page asleep sees it: unlinked and linked again, to the same copy.
    const id = app.session.vault?.id as string
    const stored = await vaultStore.get(id)
    if (!stored?.sync) throw new Error('Not linked')
    await vaultStore.put({
        ...stored,
        sync: { ...stored.sync, linkId: 'another link' },
    })
    expect(await host.session.markSynced(late, at)).toBe(false)
})

it('opens a vault made before recovery slots in two pages at once, each key sealing to the pair stored', async () => {
    const app = await page()
    // No kept session: neither page restores the other's open meanwhile.
    await app.policy.setLockAfter('now')
    await app.session.create('Main', PASSWORD)
    const id = app.session.vault?.id as string
    app.session.lock()
    const stored = await vaultStore.get(id)
    if (!stored) throw new Error('stored')
    const { password } = stored.file.slots
    await vaultStore.put({
        ...stored,
        file: { ...stored.file, slots: { password } },
        revision: (stored.revision ?? 0) + 1,
    })
    const other = await page()
    const credential = { method: 'pw' as const, password: PASSWORD }
    expect(
        await Promise.all([
            app.session.unlock(credential, id),
            other.session.unlock(credential, id),
        ]),
    ).toEqual(['opened', 'opened'])
    for (const on of [app, other])
        expect(
            await on.session.withKey(async (key) => key.recovery),
        ).toBeDefined()
    expect((await vaultStore.get(id))?.file.slots.recovery).toBeDefined()
})
