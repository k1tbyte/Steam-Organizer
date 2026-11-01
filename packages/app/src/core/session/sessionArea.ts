import { tabStorage } from '../storage'

/** Where a kept session lives so a reload or another page finds it. Each shell brings its own; values are strings. */
export interface SessionArea {
    get(key: string): Promise<string | undefined>
    set(key: string, value: string): Promise<void>
    remove(key: string): Promise<void>
    /** `listener` hears a change from any page of the area (the extension's also from this one); returns the unsubscribe. */
    watch(
        key: string,
        listener: (value: string | undefined) => void,
    ): () => void
    /** The area is gone when the browser restarts. A web tab's `sessionStorage` is not: a restored tab brings it back. */
    restartBound: boolean
}

/** Changes arrive after the call returns, as in the extension's storage. */
export function memorySessionArea(): SessionArea {
    const values = new Map<string, string>()
    const listeners = new Set<{
        key: string
        listener: (value: string | undefined) => void
    }>()
    const changed = (key: string, value: string | undefined) =>
        queueMicrotask(() => {
            for (const hearing of listeners)
                if (hearing.key === key) hearing.listener(value)
        })
    return {
        restartBound: true,
        get: async (key) => values.get(key),
        async set(key, value) {
            values.set(key, value)
            changed(key, value)
        },
        async remove(key) {
            if (values.delete(key)) changed(key, undefined)
        },
        watch(key, listener) {
            const hearing = { key, listener }
            listeners.add(hearing)
            return () => listeners.delete(hearing)
        },
    }
}

function webSessionArea(storage: Storage): SessionArea {
    return {
        restartBound: false,
        async get(key) {
            try {
                return storage.getItem(key) ?? undefined
            } catch {
                return undefined
            }
        },
        async set(key, value) {
            storage.setItem(key, value)
        },
        async remove(key) {
            storage.removeItem(key)
        },
        // A tab's own writes raise no event: only other windows sharing the storage hear them.
        watch(key, listener) {
            const hear = (event: StorageEvent) => {
                if (event.storageArea === storage && event.key === key)
                    listener(event.newValue ?? undefined)
            }
            addEventListener('storage', hear)
            return () => removeEventListener('storage', hear)
        },
    }
}

function defaultArea(): SessionArea {
    const tab = tabStorage()
    return tab ? webSessionArea(tab) : memorySessionArea()
}

let installed: SessionArea | undefined
let fallback: SessionArea | undefined

/** `createEntry` installs the shell's area; none leaves the tab's `sessionStorage` (memory where there is none). */
export function installSessionArea(area: SessionArea | undefined) {
    installed = area
}

export function sessionArea(): SessionArea {
    fallback ??= defaultArea()
    return installed ?? fallback
}
