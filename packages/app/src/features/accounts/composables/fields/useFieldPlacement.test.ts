import 'fake-indexeddb/auto'

import {
    type AccountSecret,
    FIELD_DEFAULTS,
    readSettings,
    SETTINGS_ID,
} from '@so/core'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, expect, it } from 'vitest'

import { useVaultSession } from '#features/vault'

import { useVaultAccounts } from '../useVaultAccounts'
import { useFieldPlacement } from './useFieldPlacement'

beforeEach(async () => {
    await new Promise((resolve) => {
        indexedDB.deleteDatabase('steam-organizer').onsuccess = resolve
    })
    setActivePinia(createPinia())
})

it('moves fields in every account, and later writes follow the placement', async () => {
    const session = useVaultSession()
    await session.create('Main', 'correct horse')
    const vault = useVaultAccounts()
    await vault.add({
        login: 'alpha',
        password: 'hunter22',
        steamId: null,
        alias: 'A',
    })
    const [id] = vault.accounts.value.map((account) => account.id) as [string]
    await vault.edit(id, { note: 'trade bot' })
    const fields = useFieldPlacement()

    await fields.apply({ ...FIELD_DEFAULTS, login: 'secret', note: 'secret' })

    expect(session.contents?.data.get(id)).not.toHaveProperty('login')
    expect(await session.secretOf<AccountSecret>(id)).toMatchObject({
        login: 'alpha',
        note: 'trade bot',
    })
    expect(vault.accounts.value[0]).toMatchObject({
        login: '',
        note: '',
        noteSecret: true,
    })
    expect(readSettings(session.contents?.data.get(SETTINGS_ID)).moving).toBe(
        false,
    )
    expect(fields.finished.value).toBe(1)

    await vault.edit(id, { note: 'main' })
    expect(session.contents?.data.get(id)).not.toHaveProperty('note')
    expect((await session.secretOf<AccountSecret>(id))?.note).toBe('main')

    await vault.add({
        login: 'bravo',
        password: 'hunter22',
        steamId: null,
        alias: 'B',
    })
    expect(vault.accounts.value[1]?.login).toBe('')

    await fields.apply(FIELD_DEFAULTS)
    expect(
        vault.accounts.value.map((account) => [account.login, account.note]),
    ).toEqual([
        ['alpha', 'main'],
        ['bravo', ''],
    ])
    expect(await session.secretOf<AccountSecret>(id)).not.toHaveProperty('note')
})

it('puts a restored account in the placement saved while it was deleted', async () => {
    const session = useVaultSession()
    await session.create('Main', 'correct horse')
    const vault = useVaultAccounts()
    await vault.add({
        login: 'alpha',
        password: 'hunter22',
        steamId: null,
        alias: 'A',
    })
    const [id] = vault.accounts.value.map((account) => account.id) as [string]
    const undo = await vault.remove([id])

    await useFieldPlacement().apply({ ...FIELD_DEFAULTS, login: 'secret' })
    await undo()

    expect(session.contents?.data.get(id)).not.toHaveProperty('login')
    expect((await session.secretOf<AccountSecret>(id))?.login).toBe('alpha')
})
