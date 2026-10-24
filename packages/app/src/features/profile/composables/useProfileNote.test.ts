import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, expect, it, vi } from 'vitest'
import { effectScope, ref } from 'vue'

import type { Account } from '#features/accounts'

import { useProfileNote } from './useProfileNote'

const edit = vi.fn(async () => {})
vi.mock('#features/accounts', () => ({ useVaultAccounts: () => ({ edit }) }))
const locks = new Set<() => void>()
vi.mock('#features/vault', () => ({
    useVaultSession: () => ({
        onBeforeLock: (flush: () => void) => {
            locks.add(flush)
            return () => locks.delete(flush)
        },
    }),
}))
const lock = () => {
    for (const flush of locks) flush()
}

beforeEach(() => {
    setActivePinia(createPinia())
    edit.mockClear()
    vi.useFakeTimers()
})

it('saves once typing pauses, and what is left when the page goes or the account changes', () => {
    const account = ref({ id: 'a', note: '' } as Account)
    const scope = effectScope()
    const { note } = scope.run(() => useProfileNote(account)) as ReturnType<
        typeof useProfileNote
    >

    note.value = 'tr'
    note.value = 'trade'
    expect(note.value).toBe('trade')
    expect(edit).not.toHaveBeenCalled()
    vi.advanceTimersByTime(600)
    expect(edit).toHaveBeenCalledExactlyOnceWith('a', { note: 'trade' })

    note.value = 'trade bot'
    account.value = { id: 'b', note: '' } as Account
    note.value = 'main'
    expect(edit).toHaveBeenLastCalledWith('a', { note: 'trade bot' })

    scope.stop()
    expect(edit).toHaveBeenLastCalledWith('b', { note: 'main' })
    vi.advanceTimersByTime(600)
    expect(edit).toHaveBeenCalledTimes(3)
})

it('saves a pending note before the vault locks', () => {
    const scope = effectScope()
    const { note } = scope.run(() =>
        useProfileNote({ id: 'a', note: '' } as Account),
    ) as ReturnType<typeof useProfileNote>
    note.value = 'trade'
    lock()
    expect(edit).toHaveBeenCalledExactlyOnceWith('a', { note: 'trade' })
    scope.stop()
    lock()
    expect(edit).toHaveBeenCalledOnce()
})
