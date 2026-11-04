import 'fake-indexeddb/auto'

import type { AccountSecret } from '@so/core'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, expect, it, vi } from 'vitest'

import { useVaultSession } from '#features/vault'

import { useVaultServices } from '../../../linked-services/composables/useVaultServices'
import { useAccountLocks } from '../../composables/secrets/useAccountLocks'
import { useEditSecret } from '../../composables/secrets/useEditSecret'
import { useVaultTags } from '../../composables/tags/useVaultTags'
import { useVaultAccounts } from '../../composables/useVaultAccounts'
import { partialRecords } from './partialRecords'

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (text: string) => text }) }))

beforeEach(async () => {
    await new Promise((resolve) => {
        indexedDB.deleteDatabase('steam-organizer').onsuccess = resolve
    })
    setActivePinia(createPinia())
})

it('holds the picked accounts as stored, their tags and the services they name', async () => {
    const session = useVaultSession()
    await session.create('Main', 'correct horse')
    const vault = useVaultAccounts()
    for (const login of ['one', 'two', 'three'])
        await vault.add({ login, password: 'hunter22', steamId: null })
    const [one, two, three] = vault.accounts.value.map(({ id }) => id) as [
        string,
        string,
        string,
    ]
    const tags = useVaultTags()
    const kept = (await tags.create('Trade', 1)) as string
    const other = (await tags.create('Main', 2)) as string
    await vault.setTags([one], { add: [kept] })
    await vault.setTags([three], { add: [other] })
    const services = useVaultServices()
    const used = (await services.create('Origin')) as string
    await services.create('Unused')
    await useEditSecret()(one, (secret) => ({
        secret: {
            ...secret,
            services: [
                { service: used, fields: [{ kind: 'login', value: 'o' }] },
                { service: 'discord', fields: [{ kind: 'login', value: 'd' }] },
            ],
        } satisfies AccountSecret,
    }))
    const locks = useAccountLocks()
    await locks.setLock(two, '1234', 'everything', false)
    locks.relock(two)

    const contents = session.contents
    if (!contents) throw new Error('The vault is open')
    const stored = contents.records.find(({ id }) => id === two)
    const picked = await session.withKey((key) =>
        partialRecords(key, contents, [one, two, 'gone']),
    )
    expect(picked?.accounts).toBe(2)
    expect(picked?.records.map(({ id }) => id).sort()).toEqual(
        [one, two, kept, used].sort(),
    )
    // The locked account goes sealed as it is: nothing was opened for it.
    expect(picked?.records.find(({ id }) => id === two)).toEqual(stored)
})
