import 'fake-indexeddb/auto'

import { expect, it } from 'vitest'
import { SEAL_OVERHEAD } from '../crypto/seal'
import {
    type StoredVault,
    VAULT_FORMAT,
    type VaultFile,
    vaultStore,
} from '../index'

const vault = (id: string, name: string): StoredVault => ({
    id,
    name,
    home: 'device',
    file: { id, version: 2, body: new Uint8Array([1, 2]) } as VaultFile,
})

it('keeps the working copies of several vaults', async () => {
    await vaultStore.put(vault('a', 'Main'))
    await vaultStore.put(vault('b', 'Farm'))
    await vaultStore.put(vault('a', 'Main renamed'))
    expect((await vaultStore.list()).map((v) => v.name)).toEqual([
        'Main renamed',
        'Farm',
    ])

    await vaultStore.remove('a')
    expect(await vaultStore.get('a')).toBeUndefined()
    expect(await vaultStore.get('b')).toEqual(vault('b', 'Farm'))
})

it('lets another context delete the database, then opens a fresh one', async () => {
    await vaultStore.put(vault('c', 'Other'))
    await new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase('steam-organizer')
        request.onsuccess = resolve
        request.onerror = reject
    })
    expect(await vaultStore.list()).toEqual([])
})

it('keeps the revision and the Drive link with the file', async () => {
    const linked: StoredVault = {
        ...vault('d', 'Synced'),
        revision: 3,
        sync: {
            account: 'alex@x.com',
            copyId: 'f1',
            version: '12',
            revision: 2,
            syncedAt: 1,
        },
    }
    await vaultStore.put(linked)
    expect(await vaultStore.get('d')).toEqual(linked)
})

it('reads an entry stored before the binary container as one, the same seal', async () => {
    const sealed = new Uint8Array(SEAL_OVERHEAD).fill(7)
    const file = {
        format: VAULT_FORMAT,
        version: 1,
        id: 'old',
        slots: { password: {} },
        body: sealed.toBase64(),
    }
    await vaultStore.put({
        ...vault('old', 'Old'),
        file: file as unknown as VaultFile,
    })
    const read = (await vaultStore.list()).find(({ id }) => id === 'old')
    expect(read?.file).toEqual({
        ...file,
        version: 2,
        body: sealed,
    })
    expect(await vaultStore.get('old')).toEqual(read)
})
