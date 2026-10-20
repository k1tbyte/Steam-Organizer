import { beforeEach, describe, expect, test } from 'vitest'

import { useToast } from './toast'

const store = useToast()

describe('toast store', () => {
    beforeEach(() => {
        store.toasts.value = []
    })

    test('evicting past five forgets toasts that never rendered', () => {
        for (let i = 0; i < 6; i++) store.add({ title: `Toast ${i}` })
        expect(store.toasts.value.map((toast) => toast.title)).toEqual([
            'Toast 1',
            'Toast 2',
            'Toast 3',
            'Toast 4',
            'Toast 5',
        ])
    })

    test('closing before render forgets at once', () => {
        const id = store.add({ title: 'Saved' })
        store.remove(id)
        expect(store.toasts.value).toEqual([])
    })

    test('a rendered toast stays until its exit animation ends', () => {
        const id = store.add({ title: 'Saved' })
        store.markMounted(id)
        store.remove(id)
        expect(store.toasts.value).toMatchObject([{ id, open: false }])
        store.forget(id)
        expect(store.toasts.value).toEqual([])
    })
})
