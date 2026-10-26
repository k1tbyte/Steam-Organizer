import 'fake-indexeddb/auto'

import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, expect, it } from 'vitest'

import { useVaultSession } from '#features/vault'

import { useVaultAccounts } from '../useVaultAccounts'
import { useVaultTags } from './useVaultTags'

const PASSWORD = 'correct horse'

beforeEach(async () => {
    await new Promise((resolve) => {
        indexedDB.deleteDatabase('steam-organizer').onsuccess = resolve
    })
    setActivePinia(createPinia())
})

async function opened() {
    const session = useVaultSession()
    await session.create('Main', PASSWORD)
    const vault = useVaultAccounts()
    await vault.add({ login: 'one', password: 'hunter22', steamId: null })
    const id = vault.accounts.value[0]?.id as string
    const worn = () => vault.accounts.value[0]?.tags.map((tag) => tag.label)
    return { session, vault, id, worn, tags: useVaultTags() }
}

it('creates tags unique ignoring case, puts them on accounts and renames them', async () => {
    const { vault, id, worn, tags } = await opened()
    const main = (await tags.create(' main ', 265)) as string
    const trade = (await tags.create('Trade', 150)) as string
    expect(await tags.create('MAIN', 25)).toBe(main)
    expect(tags.tags.value.map((tag) => tag.label)).toEqual(['main', 'Trade'])

    await vault.setTags([id], { add: [trade, main] })
    expect(worn()).toEqual(['Trade', 'main'])
    expect(tags.counts.value.get(main)).toBe(1)

    expect(await tags.update(trade, { label: 'Main' })).toBe(false)
    expect(await tags.update(trade, { label: 'trade', hue: 25 })).toBe(true)
    expect(tags.tags.value.find((tag) => tag.id === trade)).toMatchObject({
        label: 'trade',
        hue: 25,
    })
    await vault.setTags([id], { remove: [trade] })
    expect(worn()).toEqual(['main'])
})

it('deletes a tag off every account and undoes it, unless its label came back', async () => {
    const { vault, id, worn, tags } = await opened()
    const main = (await tags.create('main', 265)) as string
    const farm = (await tags.create('farm', 95)) as string
    await vault.setTags([id], { add: [main, farm] })

    const undoMain = await tags.remove(main)
    expect(worn()).toEqual(['farm'])
    await undoMain()
    expect(worn()).toEqual(['main', 'farm'])

    const undoFarm = await tags.remove(farm)
    // A tag change drops the deleted id, so Undo brings the tag back but not onto this account.
    await vault.setTags([id], {})
    const again = await tags.create('Farm', 45)
    await undoFarm()
    expect(tags.tags.value.map((tag) => tag.id)).toEqual([again, main])
    expect(worn()).toEqual(['main'])
})
