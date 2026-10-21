import { beforeEach, describe, expect, test } from 'vitest'

import { forget, markMounted, toasts, useToast } from './toast'

const store = useToast()

describe('toast store', () => {
    beforeEach(() => {
        toasts.value = []
    })

    test('evicting past three forgets toasts that never rendered', () => {
        for (let i = 0; i < 4; i++) store.add({ title: `Toast ${i}` })
        expect(toasts.value.map((toast) => toast.title)).toEqual([
            'Toast 1',
            'Toast 2',
            'Toast 3',
        ])
    })

    test('closing before render forgets at once', () => {
        const id = store.add({ title: 'Saved' })
        store.remove(id)
        expect(toasts.value).toEqual([])
    })

    test('a rendered toast stays until its exit animation ends', () => {
        const id = store.add({ title: 'Saved' })
        markMounted(id)
        store.remove(id)
        expect(toasts.value).toMatchObject([{ id, open: false }])
        forget(id)
        expect(toasts.value).toEqual([])
    })

    test('a danger toast stays until dismissed unless told otherwise', () => {
        store.add({ title: 'Sync failed', color: 'danger' })
        store.add({ title: 'Retried', color: 'danger', duration: 3000 })
        store.add({ title: 'Saved', color: 'success' })
        expect(toasts.value.map((toast) => toast.duration)).toEqual([
            0,
            3000,
            undefined,
        ])
    })
})
