import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { useToast } from './toast'
import { pausableTimer } from './toast-timer'

const store = useToast()

describe('toast store', () => {
    beforeEach(() => store.clear())

    test('keeps the newest three', () => {
        for (let i = 0; i < 4; i++) store.add({ title: `Toast ${i}` })
        expect(store.toasts.value.map((toast) => toast.title)).toEqual([
            'Toast 1',
            'Toast 2',
            'Toast 3',
        ])
    })

    test('a danger toast stays until dismissed unless told otherwise', () => {
        store.add({ title: 'Sync failed', color: 'danger' })
        store.add({ title: 'Retried', color: 'danger', duration: 3000 })
        store.add({ title: 'Saved', color: 'success' })
        expect(store.toasts.value.map((toast) => toast.duration)).toEqual([
            0,
            3000,
            undefined,
        ])
    })

    test('removes one, or all', () => {
        const id = store.add({ title: 'Saved' })
        store.add({ title: 'Copied' })
        store.remove(id)
        expect(store.toasts.value.map((toast) => toast.title)).toEqual([
            'Copied',
        ])
        store.clear()
        expect(store.toasts.value).toEqual([])
    })
})

describe('pausableTimer', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    test('counts whole seconds down, holds them while paused and resumes from the time left', () => {
        const end = vi.fn()
        const seconds: number[] = []
        const timer = pausableTimer(3000, end, (left) => seconds.push(left))

        timer.resume()
        vi.advanceTimersByTime(1500)
        timer.pause()
        vi.advanceTimersByTime(10_000)
        expect(end).not.toHaveBeenCalled()
        expect(seconds).toEqual([3, 2])

        timer.resume()
        vi.advanceTimersByTime(1499)
        expect(end).not.toHaveBeenCalled()
        vi.advanceTimersByTime(1)
        expect(end).toHaveBeenCalledOnce()
        expect(seconds).toEqual([3, 2, 2, 1])
    })
})
