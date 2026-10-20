import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import type { LocationQuery } from 'vue-router'

import { useCloseOnSuccess, useQueryOverlay } from './useQueryOverlay'

interface Target {
    query: LocationQuery
}

const nav = vi.hoisted(() => ({
    route: { query: {} as LocationQuery, hash: '' },
    history: {
        state: { back: null as string | null },
        location: null as string | null,
    },
    push: (_: Target) => {},
    replace: (_: string | Target) => {},
    back: () => {},
}))

vi.mock('vue-router', async () => {
    const { reactive } = await import('vue')
    const pathOf = (query: LocationQuery) => {
        const pairs = Object.entries(query).map(([key, value]) =>
            value === null ? key : `${key}=${value}`,
        )
        return pairs.length === 0 ? '/' : `/?${pairs.join('&')}`
    }
    // Decodes like the router, so `%20` and a space read alike.
    const queryOf = (path: string): LocationQuery =>
        Object.fromEntries(
            (path.split('?')[1] ?? '')
                .split('&')
                .filter((pair) => pair !== '')
                .map((pair) => {
                    const [key = '', value] = pair.split('=')
                    return [
                        key,
                        value === undefined ? null : decodeURIComponent(value),
                    ]
                }),
        )
    const route = reactive({
        query: {} as LocationQuery,
        hash: '',
        get fullPath(): string {
            return pathOf(this.query)
        },
    })
    nav.route = route
    return {
        useRoute: () => route,
        useRouter: () => ({
            options: {
                history: {
                    get state() {
                        return nav.history.state
                    },
                    // The address bar, ahead of the route while a pop lands.
                    get location() {
                        return nav.history.location ?? route.fullPath
                    },
                },
            },
            resolve: (to: string | Target) => {
                const query = typeof to === 'string' ? queryOf(to) : to.query
                return { path: '/', query, hash: '', fullPath: pathOf(query) }
            },
            push: (to: Target) => {
                nav.history.state = { back: pathOf(nav.route.query) }
                nav.route.query = to.query
                nav.push(to)
            },
            replace: (to: string | Target) => {
                nav.history.state = { back: nav.history.state.back }
                nav.route.query =
                    typeof to === 'string' ? queryOf(to) : to.query
                nav.replace(to)
            },
            back: () => nav.back(),
        }),
    }
})

const SECTIONS = ['account', 'security'] as const

function at(query: LocationQuery, back: string | null = null) {
    nav.route.query = query
    nav.history.state = { back }
    nav.history.location = null
}

beforeEach(() => {
    nav.push = vi.fn()
    nav.replace = vi.fn()
    nav.back = vi.fn()
})

describe('useQueryOverlay', () => {
    it('reads an unknown value as the first, a bare flag as open', () => {
        at({ settings: 'appearance', upload: null })

        expect(
            useQueryOverlay('settings', { values: SECTIONS }).value.value,
        ).toBe('account')
        expect(useQueryOverlay('upload').open.value).toBe(true)
    })

    it('holds its value while closed', async () => {
        at({ settings: 'security' })
        const overlay = useQueryOverlay('settings', { values: SECTIONS })

        nav.route.query = {}
        await nextTick()

        expect(overlay.open.value).toBe(false)
        expect(overlay.value.value).toBe('security')
    })

    it('pushes to open and replaces to switch', () => {
        at({})
        const overlay = useQueryOverlay('settings', { values: SECTIONS })

        overlay.show('security')
        overlay.show('account')

        expect(nav.push).toHaveBeenCalledWith({
            query: { settings: 'security' },
            hash: '',
        })
        expect(nav.replace).toHaveBeenCalledWith({
            query: { settings: 'account' },
            hash: '',
        })
    })

    it('pops the entry that opened it, once', () => {
        at({ q: 'cats' })
        const overlay = useQueryOverlay('upload')

        overlay.open.value = true
        overlay.close()
        overlay.close()

        expect(nav.back).toHaveBeenCalledTimes(1)
        expect(nav.replace).not.toHaveBeenCalled()
    })

    it('pops back to an entry spelled another way', () => {
        at({ q: 'big cats', upload: null }, '/?q=big%20cats')

        useQueryOverlay('upload').close()

        expect(nav.back).toHaveBeenCalledTimes(1)
    })

    it('ignores a dismissal while a pop is still landing', () => {
        at({ auth: 'login', next: '/?q=cats' }, '/?q=cats')
        nav.history.location = '/?q=cats'

        useQueryOverlay('auth', { owns: ['next'] }).close()

        expect(nav.back).not.toHaveBeenCalled()
        expect(nav.replace).not.toHaveBeenCalled()
    })

    it('leaves to a target, popping only when it is the entry behind', () => {
        at({ auth: 'login', next: '/' }, '/')
        useQueryOverlay('auth', { owns: ['next'] }).close('/?q=cats')
        expect(nav.back).not.toHaveBeenCalled()

        at({ auth: 'login', next: '/' }, '/?q=cats')
        useQueryOverlay('auth', { owns: ['next'] }).close('/?q=cats')
        expect(nav.back).toHaveBeenCalledTimes(1)
    })

    it('replaces a deep link and drops the keys it owns', () => {
        at({ auth: 'login', next: '/library', q: 'cats' })

        useQueryOverlay('auth', { owns: ['next'] }).close()

        expect(nav.back).not.toHaveBeenCalled()
        expect(nav.replace).toHaveBeenCalledWith('/?q=cats')
    })
})

describe('useCloseOnSuccess', () => {
    it('closes on success, but not an overlay reopened meanwhile', async () => {
        const open = ref(true)
        const finish = useCloseOnSuccess(open)
        let settle = (_: boolean) => {}
        const late = finish(
            () =>
                new Promise<boolean>((resolve) => {
                    settle = resolve
                }),
        )

        open.value = false
        await nextTick()
        open.value = true
        await nextTick()
        settle(true)
        await late
        expect(open.value).toBe(true)

        await finish(async () => true)
        expect(open.value).toBe(false)
    })
})
