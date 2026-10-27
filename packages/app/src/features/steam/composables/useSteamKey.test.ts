import 'fake-indexeddb/auto'

import { readSettings, SETTINGS_ID } from '@so/core'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, expect, it } from 'vitest'
import { effectScope, nextTick } from 'vue'

import { useVaultSession } from '#features/vault'

import { readSteamKey, useSteamKey } from './useSteamKey'

const KEY = 'A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6'

beforeEach(async () => {
    await new Promise((resolve) => {
        indexedDB.deleteDatabase('steam-organizer').onsuccess = resolve
    })
    setActivePinia(createPinia())
})

it('seals the key in the settings record, keeps its data, and follows a removal', async () => {
    const session = useVaultSession()
    await session.create('Main', 'correct horse')
    const steamKey = effectScope().run(() => useSteamKey())
    if (!steamKey) throw new Error('no key')

    await steamKey.save(KEY)
    expect(await readSteamKey(session)).toBe(KEY)
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(steamKey.key.value).toBe(KEY)
    expect(session.contents?.data.get(SETTINGS_ID)).toEqual(
        readSettings(undefined),
    )

    await steamKey.save('')
    expect(await readSteamKey(session)).toBe('')
})
