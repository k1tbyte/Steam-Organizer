import 'fake-indexeddb/auto'

import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, expect, it } from 'vitest'

import { useVaultSession } from '#features/vault'

import { useVaultAccounts } from './useVaultAccounts'

const PASSWORD = 'correct horse'
const ids = (vault: ReturnType<typeof useVaultAccounts>) =>
    vault.accounts.value.map((account) => account.login)

beforeEach(async () => {
    await new Promise((resolve) => {
        indexedDB.deleteDatabase('steam-organizer').onsuccess = resolve
    })
    setActivePinia(createPinia())
})

async function reopened() {
    setActivePinia(createPinia())
    const session = useVaultSession()
    await session.load()
    await session.unlock({ method: 'pw', password: PASSWORD })
    return useVaultAccounts()
}

it('adds, pins and moves accounts in the vault, and a reload keeps them', async () => {
    const session = useVaultSession()
    await session.create('Main', PASSWORD)
    const vault = useVaultAccounts()
    for (const login of ['one', 'two', 'three'])
        expect(
            await vault.add({ login, password: 'hunter22', steamId: null }),
        ).toBe('added')
    expect(
        await vault.add({ login: ' ONE ', password: 'x', steamId: null }),
    ).toBe('login-taken')
    expect(ids(vault)).toEqual(['one', 'two', 'three'])

    const [one, , three] = vault.accounts.value.map((account) => account.id)
    // Both rewrite `one`, queued: the move reads the pin, so neither loses the other.
    vault.togglePin(one as string)
    vault.move({ ids: [one as string], after: three as string, before: null })
    expect(ids(vault)).toEqual(['two', 'three', 'one'])
    // The queue runs in order: an empty change settles once both writes have.
    await session.transact(async () => [])

    const reloaded = await reopened()
    expect(ids(reloaded)).toEqual(['two', 'three', 'one'])
    expect(reloaded.accounts.value.at(-1)?.pinned).toBe(true)
})

it('saves a change accepted before a lock', async () => {
    const session = useVaultSession()
    await session.create('Main', PASSWORD)
    const vault = useVaultAccounts()
    await vault.add({ login: 'one', password: 'hunter22', steamId: null })
    vault.togglePin(vault.accounts.value[0]?.id as string)
    const settled = session.transact(async () => [])
    session.lock()
    await settled

    const reloaded = await reopened()
    expect(reloaded.accounts.value[0]?.pinned).toBe(true)
})

it('edits the alias and note, and deletes to a tombstone', async () => {
    const session = useVaultSession()
    await session.create('Main', PASSWORD)
    const vault = useVaultAccounts()
    for (const login of ['one', 'two'])
        await vault.add({ login, password: 'hunter22', steamId: null })
    const [one, two] = vault.accounts.value.map((account) => account.id) as [
        string,
        string,
    ]
    await vault.edit(one, { alias: 'Main', note: 'trade bot' })
    expect(vault.accounts.value[0]).toMatchObject({
        nickname: 'Main',
        note: 'trade bot',
    })
    await vault.edit(one, { alias: undefined })
    expect(vault.accounts.value[0]?.nickname).toBe('one')

    await vault.remove([two])
    expect(ids(vault)).toEqual(['one'])
    expect(session.contents?.records.find((r) => r.id === two)).toMatchObject({
        deleted: true,
    })

    const reloaded = await reopened()
    expect(ids(reloaded)).toEqual(['one'])
    expect(reloaded.accounts.value[0]?.note).toBe('trade bot')
})
