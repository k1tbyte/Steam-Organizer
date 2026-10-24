import 'fake-indexeddb/auto'

import { expect, it } from 'vitest'

import { type StoredVault, type VaultFile, vaultStore } from '../index'

const vault = (id: string, name: string): StoredVault => ({
    id,
    name,
    home: 'device',
    file: { id, body: 'sealed' } as VaultFile,
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
