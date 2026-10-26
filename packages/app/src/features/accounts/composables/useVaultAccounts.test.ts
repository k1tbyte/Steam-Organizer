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

it('undoes a deletion with the same record, unless the login came back meanwhile', async () => {
    const session = useVaultSession()
    await session.create('Main', PASSWORD)
    const vault = useVaultAccounts()
    for (const login of ['one', 'two'])
        await vault.add({ login, password: 'hunter22', steamId: null })
    const [one, two] = vault.accounts.value.map((account) => account.id)

    const undoOne = await vault.remove([one as string])
    const undoTwo = await vault.remove([two as string])
    await vault.add({ login: 'two', password: 'hunter22', steamId: null })
    await undoOne()
    await undoTwo()

    // The new `two` took the key `one` had in the emptied vault, so `one` comes back after it.
    const reloaded = await reopened()
    expect(ids(reloaded)).toEqual(['two', 'one'])
    expect(reloaded.accounts.value.map((account) => account.id)).toContain(one)
    expect(reloaded.accounts.value.map((account) => account.id)).not.toContain(
        two,
    )
})

it('undoes a deletion beside other anonymous accounts, unless its Steam ID came back meanwhile', async () => {
    const session = useVaultSession()
    await session.create('Main', PASSWORD)
    const vault = useVaultAccounts()
    const STEAM = '76561199044795099'
    await vault.add({ login: 'anon', password: 'hunter22', steamId: null })
    await vault.add({ login: 'old', password: 'hunter22', steamId: STEAM })
    await vault.add({ login: 'spare', password: 'hunter22', steamId: null })
    const byLogin = (login: string) =>
        vault.accounts.value.find((account) => account.login === login)
            ?.id as string

    const undo = await vault.remove([byLogin('anon'), byLogin('old')])
    await vault.add({ login: 'new', password: 'hunter22', steamId: STEAM })
    await undo()

    const reloaded = await reopened()
    expect(ids(reloaded).sort()).toEqual(['anon', 'new', 'spare'])
})
