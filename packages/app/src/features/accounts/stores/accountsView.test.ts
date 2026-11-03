import 'fake-indexeddb/auto'

import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, expect, it, vi } from 'vitest'

import { useVaultSession } from '#features/vault'

import { useAccountsViewStore } from './accountsView'

const PASSWORD = 'correct horse'

beforeEach(() => {
    const data = new Map<string, string>()
    vi.stubGlobal('localStorage', {
        getItem: (key: string) => data.get(key) ?? null,
        setItem: (key: string, value: string) => data.set(key, value),
        removeItem: (key: string) => data.delete(key),
    })
    setActivePinia(createPinia())
})

it('keeps the filters and sort per vault, and never the search', async () => {
    const session = useVaultSession()
    const view = useAccountsViewStore()
    await session.create('Main', PASSWORD)
    const main = session.vault?.id as string
    view.setSort('level')
    view.cycleBan('vac')
    view.setQuery('login1')

    await session.create('Second', PASSWORD)
    expect(view.view.sort).not.toBe('level')
    expect(view.view.query).toBe('')

    session.lock()
    await session.unlock({ method: 'pw', password: PASSWORD }, main)
    expect(view.view.sort).toBe('level')
    expect(view.view.bans.vac).not.toBe('any')
    expect(view.view.query).toBe('')
})
