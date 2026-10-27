import 'fake-indexeddb/auto'

import type { AccountSecret } from '@so/core'
import { createPinia, setActivePinia } from 'pinia'
import { expect, it } from 'vitest'

import { useVaultSession } from '#features/vault'
import { useVaultAccounts } from '../useVaultAccounts'
import { useEditSecret } from './useEditSecret'

it('rewrites the secret and the data part the change names', async () => {
    setActivePinia(createPinia())
    const session = useVaultSession()
    await session.load()
    await session.create('Main', 'correct horse')
    await useVaultAccounts().add({
        login: 'alpha',
        password: 'old-pass',
        steamId: null,
        alias: 'Alpha',
    })
    const id = [...(session.contents?.data.keys() ?? [])][0] as string

    await useEditSecret()(id, (secret, data) => ({
        secret: { ...secret, password: 'new-pass' },
        data: { ...data, guard: true },
    }))

    expect((await session.secretOf<AccountSecret>(id))?.password).toBe(
        'new-pass',
    )
    expect(session.contents?.data.get(id)).toMatchObject({
        guard: true,
        login: 'alpha',
    })
    expect(await useEditSecret()(id, () => null)).toBe(false)
    expect(await useEditSecret()('missing', (secret) => ({ secret }))).toBe(
        true,
    )
})
