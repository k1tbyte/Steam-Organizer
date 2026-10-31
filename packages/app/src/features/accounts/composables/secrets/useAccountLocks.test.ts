import 'fake-indexeddb/auto'

import type { AccountSecret } from '@so/core'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, expect, it } from 'vitest'

import { useVaultSession } from '#features/vault'

import { useVaultTags } from '../tags/useVaultTags'
import { useVaultAccounts } from '../useVaultAccounts'
import { useAccountLocks } from './useAccountLocks'
import { useEditSecret } from './useEditSecret'

const MASTER = 'correct horse'

beforeEach(async () => {
    await new Promise((resolve) => {
        indexedDB.deleteDatabase('steam-organizer').onsuccess = resolve
    })
    setActivePinia(createPinia())
})

async function lockedAccount(
    scope: 'credentials' | 'everything',
    recovery = true,
) {
    const session = useVaultSession()
    await session.create('Main', MASTER)
    const vault = useVaultAccounts()
    await vault.add({
        login: 'alpha',
        password: 'hunter22',
        steamId: '76561198000000001',
        alias: 'Main',
    })
    const [id] = vault.accounts.value.map((account) => account.id) as [string]
    const locks = useAccountLocks()
    await locks.setLock(id, '1234', scope, recovery)
    const account = () => vault.accounts.value.find((found) => found.id === id)
    return { session, vault, locks, id, account }
}

it('locks an account: open until relocked, then sealed from the vault key', async () => {
    const { session, locks, id, account } = await lockedAccount('credentials')
    expect(account()).toMatchObject({
        locked: false,
        lock: { scope: 'credentials', recovery: true },
    })
    expect(session.contents?.data.get(id)).not.toHaveProperty('login')

    locks.relock(id)
    expect(account()?.locked).toBe(true)
    await expect(session.secretOf(id)).rejects.toThrow()
    expect(await useEditSecret()(id, (secret) => ({ secret }))).toBe(false)

    expect(await locks.unlock(id, { password: '0000' })).toBe(false)
    expect(await locks.unlock(id, { password: '1234' })).toBe(true)
    expect((await session.secretOf<AccountSecret>(id))?.login).toBe('alpha')
})

it('stamps a lock and its removal as edits, so a sync keeps them over a refresh elsewhere', async () => {
    const before = Date.now()
    const { session, locks, id } = await lockedAccount('credentials')
    const editedAt = () =>
        (session.contents?.data.get(id) as { editedAt?: number } | undefined)
            ?.editedAt ?? 0
    expect(editedAt()).toBeGreaterThanOrEqual(before)
    const locked = editedAt()
    await new Promise((resolve) => setTimeout(resolve, 2))
    expect(await locks.removeLock(id, { password: '1234' })).toBe(true)
    expect(editedAt()).toBeGreaterThan(locked)
})

it('opens through recovery with the master password, and locks again with the vault', async () => {
    const { session, locks, id, account } = await lockedAccount('credentials')
    session.lock()
    await session.unlock({ method: 'pw', password: MASTER })
    expect(account()?.locked).toBe(true)
    expect(await locks.unlock(id, { master: 'wrong' })).toBe(false)
    expect(await locks.unlock(id, { master: MASTER })).toBe(true)
})

it('keeps only the face in data under an everything lock, and edits keep it so', async () => {
    const { session, vault, locks, id } = await lockedAccount('everything')
    const stored = session.contents?.data.get(id)
    expect(stored).not.toHaveProperty('steamId')
    expect(stored).toMatchObject({ alias: 'Main' })

    await vault.edit(id, { alias: 'Renamed', note: 'trade bot' })
    expect(session.contents?.data.get(id)).not.toHaveProperty('steamId')
    expect(session.contents?.data.get(id)).not.toHaveProperty('note')
    const secret = await session.secretOf<AccountSecret>(id)
    expect(secret?.hidden).toMatchObject({ steamId: '76561198000000001' })
    expect(secret?.note).toBe('trade bot')

    expect(await locks.removeLock(id, { password: '1234' })).toBe(true)
    expect(session.contents?.data.get(id)).toMatchObject({
        steamId: '76561198000000001',
        alias: 'Renamed',
        login: 'alpha',
    })
    expect(session.keyOf(id)).toBeUndefined()
})

it('changes the account password, by the old one or the master password', async () => {
    const { locks, id } = await lockedAccount('credentials')
    expect(await locks.changePassword(id, { password: 'nope' }, 'abcd')).toBe(
        false,
    )
    expect(await locks.changePassword(id, { master: MASTER }, 'abcd')).toBe(
        true,
    )
    locks.relock(id)
    expect(await locks.unlock(id, { password: '1234' })).toBe(false)
    expect(await locks.unlock(id, { password: 'abcd' })).toBe(true)
})

it('tags an open everything-locked account through its secret', async () => {
    const { session, vault, locks, id } = await lockedAccount('everything')
    const tag = (await useVaultTags().create('Main', 200)) as string
    await vault.setTags([id], { add: [tag] })
    await session.transact(async () => [])
    expect(session.contents?.data.get(id)).not.toHaveProperty('tags')
    expect((await session.secretOf<AccountSecret>(id))?.hidden?.tags).toEqual([
        tag,
    ])

    locks.relock(id)
    await vault.setTags([id], { remove: [tag] })
    await session.transact(async () => [])
    expect(await locks.unlock(id, { password: '1234' })).toBe(true)
    expect((await session.secretOf<AccountSecret>(id))?.hidden?.tags).toEqual([
        tag,
    ])
})

it('keeps an account locked when it was left while its key opened', async () => {
    const { locks, id, account } = await lockedAccount('credentials')
    locks.relock(id)
    const opening = locks.unlock(id, { password: '1234' })
    locks.relock(id)
    expect(await opening).toBe(true)
    expect(account()?.locked).toBe(true)
})

it('refuses a note edit while the account is locked, so the draft stays for Retry', async () => {
    const { vault, locks, id } = await lockedAccount('credentials')
    locks.relock(id)
    await expect(vault.edit(id, { note: 'lost?' })).rejects.toThrow()
})

it('still refuses a duplicate Steam ID that an everything lock hides', async () => {
    const { vault, locks, id } = await lockedAccount('everything')
    locks.relock(id)
    const added = await vault.add({
        login: 'beta',
        password: 'pw',
        steamId: '76561198000000001',
    })
    expect(added).toBe('steam-taken')
})
