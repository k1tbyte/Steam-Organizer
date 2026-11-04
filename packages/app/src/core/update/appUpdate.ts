import { computed, shallowRef } from 'vue'

import { usePlatform } from '../platform'
import { parseRecord } from '../storage'
import { APP_VERSION } from '../version'

type Listener = () => void

/** What the watch reads of a `ServiceWorker`. */
export interface UpdateWorker {
    readonly state: string
    postMessage(message: unknown): void
    addEventListener(type: 'statechange', listener: Listener): void
}

export interface UpdateRegistration {
    readonly installing: UpdateWorker | null
    readonly waiting: UpdateWorker | null
    addEventListener(type: 'updatefound', listener: Listener): void
}

/** `navigator.serviceWorker`, as far as the watch reads it. */
export interface UpdateContainer {
    readonly controller: unknown
    /** Never settles where no worker registers (dev). */
    readonly ready: Promise<UpdateRegistration>
    addEventListener(type: 'controllerchange', listener: Listener): void
}

export interface AppUpdate {
    /** What the waiting build calls itself; null when its `version.json` could not be read. */
    version: string | null
}

export interface UpdateWatchOptions {
    readVersion?: () => Promise<string | null>
    reload?: () => void
}

// vite-plugin-pwa's prompt-mode worker waits until a page sends this.
const SKIP_WAITING = { type: 'SKIP_WAITING' }

const found = shallowRef<AppUpdate | null>(null)
let watching = false
let applyFound: () => void = () => {}

async function servedVersion(): Promise<string | null> {
    try {
        const response = await fetch(
            `${import.meta.env.BASE_URL}version.json`,
            { cache: 'no-store' },
        )
        const { version } = parseRecord(await response.text())
        return typeof version === 'string' ? version : null
    } catch {
        return null
    }
}

/** Watches for a build waiting to take this page over, once per page. */
export function watchAppUpdate(
    container: UpdateContainer,
    {
        readVersion = servedVersion,
        reload = () => location.reload(),
    }: UpdateWatchOptions = {},
) {
    if (watching) return
    watching = true
    let waiting: UpdateWorker | null = null
    let applying = false

    async function offer(worker: UpdateWorker) {
        // A first install has no page to take over, so it never waits.
        if (worker === waiting || !container.controller) return
        waiting = worker
        const version = await readVersion()
        // A newer build replaced it while its version was read.
        if (waiting === worker) found.value = { version }
    }

    function follow(worker: UpdateWorker | null) {
        if (!worker) return
        const installed = () => {
            if (worker.state === 'installed') void offer(worker)
        }
        worker.addEventListener('statechange', installed)
        installed()
    }

    void container.ready.then((registration) => {
        follow(registration.waiting)
        // A worker already installing when ready resolves fires no updatefound.
        follow(registration.installing)
        registration.addEventListener('updatefound', () =>
            follow(registration.installing),
        )
    })

    applyFound = () => {
        if (!waiting || applying) return
        applying = true
        // Another page already handed it control.
        if (container.controller === waiting) return reload()
        container.addEventListener('controllerchange', reload)
        waiting.postMessage(SKIP_WAITING)
    }
}

/** Starts the watch on web: browsers update an extension themselves, and dev registers no worker. */
export function useAppUpdateWatch() {
    if (usePlatform().kind === 'web' && 'serviceWorker' in navigator)
        watchAppUpdate(navigator.serviceWorker)
}

/** The running version and the build waiting to replace it; `apply` reloads into that build. */
export function useAppUpdate() {
    return {
        version: APP_VERSION,
        update: computed(() => found.value),
        apply: () => applyFound(),
    }
}
