import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, expect, it, vi } from 'vitest'
import { effectScope, ref } from 'vue'

import type { Account } from '#features/accounts'

import { useProfileNote } from './useProfileNote'

const edit = vi.fn(async (_id: string, _patch: { note: string }) => {})
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
    vi.advanceTimersByTime(800)
    expect(edit).toHaveBeenCalledExactlyOnceWith('a', { note: 'trade' })

    note.value = 'trade bot'
    account.value = { id: 'b', note: '' } as Account
    note.value = 'main'
    expect(edit).toHaveBeenLastCalledWith('a', { note: 'trade bot' })

    scope.stop()
    expect(edit).toHaveBeenLastCalledWith('b', { note: 'main' })
    vi.advanceTimersByTime(800)
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

it('shows saving while typing, then saved for a moment, and keeps a failure until a retry lands', async () => {
    const scope = effectScope()
    const { note, status, faded, retry } = scope.run(() =>
        useProfileNote({ id: 'a', note: '' } as Account),
    ) as ReturnType<typeof useProfileNote>

    edit.mockRejectedValueOnce(new Error('disk full'))
    note.value = 'trade'
    expect(status.value).toBe('saving')
    await vi.advanceTimersByTimeAsync(800)
    expect(status.value).toBe('failed')

    retry()
    expect(status.value).toBe('saving')
    await vi.advanceTimersByTimeAsync(0)
    expect(edit).toHaveBeenLastCalledWith('a', { note: 'trade' })
    expect([status.value, faded.value]).toEqual(['saved', false])
    await vi.advanceTimersByTimeAsync(2000)
    expect(faded.value).toBe(true)
    scope.stop()
})

it('keeps a failed save across a remount: Retry shows, and leaving tries again', async () => {
    const first = effectScope()
    const typed = first.run(() =>
        useProfileNote({ id: 'a', note: '' } as Account),
    ) as ReturnType<typeof useProfileNote>
    edit.mockRejectedValueOnce(new Error('disk full'))
    typed.note.value = 'trade'
    await vi.advanceTimersByTimeAsync(800)
    first.stop()

    const second = effectScope()
    const reopened = second.run(() =>
        useProfileNote({ id: 'a', note: '' } as Account),
    ) as ReturnType<typeof useProfileNote>
    expect([reopened.note.value, reopened.status.value]).toEqual([
        'trade',
        'failed',
    ])
    edit.mockClear()
    second.stop()
    expect(edit).toHaveBeenCalledExactlyOnceWith('a', { note: 'trade' })
})
