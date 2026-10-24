import 'fake-indexeddb/auto'

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
