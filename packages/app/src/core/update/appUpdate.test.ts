import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import type {
    UpdateContainer,
    UpdateRegistration,
    UpdateWorker,
} from './appUpdate'

type Listener = () => void

class FakeWorker implements UpdateWorker {
    messages: unknown[] = []
    private listeners: Listener[] = []
    constructor(public state = 'installing') {}
    postMessage(message: unknown) {
        this.messages.push(message)
    }
    addEventListener(_type: 'statechange', listener: Listener) {
        this.listeners.push(listener)
    }
    become(state: string) {
        this.state = state
        for (const listener of this.listeners) listener()
    }
}

class FakeRegistration implements UpdateRegistration {
    installing: FakeWorker | null = null
    private listeners: Listener[] = []
    constructor(public waiting: FakeWorker | null = null) {}
    addEventListener(_type: 'updatefound', listener: Listener) {
        this.listeners.push(listener)
    }
    /** A new build starts installing, as after a deploy. */
    install() {
        const worker = new FakeWorker()
        this.installing = worker
        for (const listener of this.listeners) listener()
        return worker
    }
}

class FakeContainer implements UpdateContainer {
    private listeners: Listener[] = []
    readonly ready: Promise<UpdateRegistration>
    constructor(
        readonly registration: FakeRegistration,
        public controller: unknown = new FakeWorker('activated'),
    ) {
        this.ready = Promise.resolve(registration)
    }
    addEventListener(_type: 'controllerchange', listener: Listener) {
        this.listeners.push(listener)
    }
    takeOver(worker: FakeWorker) {
        worker.become('activated')
        this.controller = worker
        for (const listener of this.listeners) listener()
    }
}

const settle = () => new Promise((resolve) => setTimeout(resolve))

// The watch is once per page: each test loads a fresh module.
async function load() {
    vi.resetModules()
    return import('./appUpdate')
}

const reload = vi.fn()
beforeEach(() => {
    reload.mockClear()
})
afterEach(() => {
    vi.unstubAllGlobals()
})

it('offers a build already waiting when the page loads, named by its version.json read past the cache', async () => {
    const fetch = vi.fn(
        async () => new Response(JSON.stringify({ version: '3.0.2' })),
    )
    vi.stubGlobal('fetch', fetch)
    const { watchAppUpdate, useAppUpdate } = await load()
    const container = new FakeContainer(
        new FakeRegistration(new FakeWorker('installed')),
    )
    watchAppUpdate(container, { reload })
    await settle()
    expect(fetch).toHaveBeenCalledWith('/version.json', { cache: 'no-store' })
    expect(useAppUpdate().update.value).toEqual({ version: '3.0.2' })
})

it('names no version when version.json cannot be read', async () => {
    vi.stubGlobal('fetch', async () => {
        throw new TypeError('offline')
    })
    const { watchAppUpdate, useAppUpdate } = await load()
    watchAppUpdate(
        new FakeContainer(new FakeRegistration(new FakeWorker('installed'))),
        { reload },
    )
    await settle()
    expect(useAppUpdate().update.value).toEqual({ version: null })
})

it('offers a build once it has installed while the page runs, not before', async () => {
    const { watchAppUpdate, useAppUpdate } = await load()
    const registration = new FakeRegistration()
    watchAppUpdate(new FakeContainer(registration), {
        readVersion: async () => '3.0.2',
        reload,
    })
    await settle()
    expect(useAppUpdate().update.value).toBeNull()

    const worker = registration.install()
    await settle()
    expect(useAppUpdate().update.value).toBeNull()
    worker.become('installed')
    await settle()
    expect(useAppUpdate().update.value).toEqual({ version: '3.0.2' })
})

it('offers a build already installing when the page loads, once it has installed', async () => {
    const { watchAppUpdate, useAppUpdate } = await load()
    const registration = new FakeRegistration()
    const worker = new FakeWorker()
    registration.installing = worker
    watchAppUpdate(new FakeContainer(registration), {
        readVersion: async () => '3.0.2',
        reload,
    })
    await settle()
    expect(useAppUpdate().update.value).toBeNull()

    worker.become('installed')
    await settle()
    expect(useAppUpdate().update.value).toEqual({ version: '3.0.2' })
})

it('never offers the first install: no page is waiting on it', async () => {
    const { watchAppUpdate, useAppUpdate } = await load()
    const registration = new FakeRegistration()
    const readVersion = vi.fn(async () => '3.0.0')
    watchAppUpdate(new FakeContainer(registration, null), {
        readVersion,
        reload,
    })
    await settle()
    registration.install().become('installed')
    await settle()
    expect(readVersion).not.toHaveBeenCalled()
    expect(useAppUpdate().update.value).toBeNull()
})

it('keeps the newest build when the version read for an older one lands late', async () => {
    const { watchAppUpdate, useAppUpdate } = await load()
    const registration = new FakeRegistration()
    const reads: ((version: string) => void)[] = []
    watchAppUpdate(new FakeContainer(registration), {
        readVersion: () => new Promise((resolve) => reads.push(resolve)),
        reload,
    })
    await settle()
    registration.install().become('installed')
    registration.install().become('installed')
    reads[1]?.('3.0.3')
    await settle()
    reads[0]?.('3.0.2')
    await settle()
    expect(useAppUpdate().update.value).toEqual({ version: '3.0.3' })
})

it('hands the waiting build the page and reloads once it controls it, once', async () => {
    const { watchAppUpdate, useAppUpdate } = await load()
    const waiting = new FakeWorker('installed')
    const container = new FakeContainer(new FakeRegistration(waiting))
    watchAppUpdate(container, { readVersion: async () => '3.0.2', reload })
    await settle()

    const { apply } = useAppUpdate()
    apply()
    apply()
    expect(waiting.messages).toEqual([{ type: 'SKIP_WAITING' }])
    expect(reload).not.toHaveBeenCalled()
    container.takeOver(waiting)
    expect(reload).toHaveBeenCalledOnce()
})

it('reloads at once when another page already handed it control', async () => {
    const { watchAppUpdate, useAppUpdate } = await load()
    const waiting = new FakeWorker('installed')
    const container = new FakeContainer(new FakeRegistration(waiting))
    watchAppUpdate(container, { readVersion: async () => '3.0.2', reload })
    await settle()
    container.takeOver(waiting)

    useAppUpdate().apply()
    expect(waiting.messages).toEqual([])
    expect(reload).toHaveBeenCalledOnce()
})

it('applies nothing while no build waits, and watches once per page', async () => {
    const { watchAppUpdate, useAppUpdate } = await load()
    const first = new FakeContainer(new FakeRegistration())
    const second = new FakeContainer(
        new FakeRegistration(new FakeWorker('installed')),
    )
    watchAppUpdate(first, { readVersion: async () => '3.0.2', reload })
    watchAppUpdate(second, { readVersion: async () => '3.0.2', reload })
    await settle()
    useAppUpdate().apply()
    expect(useAppUpdate().update.value).toBeNull()
    expect(reload).not.toHaveBeenCalled()
})

it('reports the running version from the root package.json', async () => {
    const { useAppUpdate } = await load()
    expect(useAppUpdate().version).toMatch(/^\d+\.\d+\.\d+$/)
})
