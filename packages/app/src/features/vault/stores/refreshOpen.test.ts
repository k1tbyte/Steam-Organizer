import { createVault, sealRecord, vaultStore } from '@so/core'
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
    return { app, host }
}

const write = (on: Page, id: string, data: object) =>
    on.session.transact(async (_, key) => [
        await sealRecord(key, { id, updatedAt: Date.now(), data }),
    ])

const dataOf = (on: Page, id: string) => on.session.contents?.data.get(id)

beforeEach(async () => {
    await freshDevice()
})

afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
})

it('takes in an edit and a deletion another page made', async () => {
    const { app, host } = await twoPages()
    await write(app, 'one', { n: 2 })
    await app.session.transact(async () => [
        { id: 'two', updatedAt: Date.now() + 1, deleted: true },
    ])
    // Until it looks again, the host holds what it opened.
    expect(dataOf(host, 'one')).toEqual({ n: 1 })
    expect(dataOf(host, 'two')).toEqual({ n: 1 })

    await host.session.refreshOpen()
    expect(dataOf(host, 'one')).toEqual({ n: 2 })
    expect(host.session.contents?.data.has('two')).toBe(false)
    expect(host.session.state).toBe('unlocked')
})

it('does not open the records again while the stored file is the one held', async () => {
    const { host } = await twoPages()
    const before = host.session.contents
    await host.session.refreshOpen()
    expect(host.session.contents).toBe(before)
})

it('drops the held record keys when the file changed', async () => {
    const { app, host } = await twoPages()
    const key = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt'],
    )
    host.session.keyHolder('one')(key)
    await host.session.refreshOpen()
    // Unchanged: the key stays.
    expect(host.session.keyOf('one')).toBe(key)

    await write(app, 'one', { n: 3 })
    await host.session.refreshOpen()
    expect(host.session.keyOf('one')).toBeUndefined()
})

it('locks a page whose vault another page removed from the disk, and drops it from the list', async () => {
    const { host } = await twoPages()
    // Straight from the store: no lock of the kept entry reaches the host first.
    await vaultStore.remove(host.session.vault?.id as string)
    await host.session.refreshOpen()
    // Locked, and the list no longer holds it: no vault left.
    expect(host.session.state).toBe('new')
    expect(host.session.contents).toBeNull()
})

it('locks a page whose held key no longer opens the stored file', async () => {
    // The restore it tries after the lock reports the file it cannot open.
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { host } = await twoPages()
    const id = host.session.vault?.id as string
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
