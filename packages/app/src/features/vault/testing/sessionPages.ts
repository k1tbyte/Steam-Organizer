import 'fake-indexeddb/auto'

import { createPinia, setActivePinia } from 'pinia'
import { vi } from 'vitest'

import { installSessionArea, memorySessionArea } from '#core'

import { useLockPolicy } from '../stores/useLockPolicy'
import { useVaultSecurity } from '../stores/useVaultSecurity'
import { useVaultSession } from '../stores/useVaultSession'

/** One browser tab or popup: its own Pinia over the shared session area and IndexedDB. */
export async function page() {
    const pinia = createPinia()
    setActivePinia(pinia)
    const session = useVaultSession(pinia)
    await session.load()
    return {
        session,
        security: useVaultSecurity(pinia),
        policy: useLockPolicy(pinia),
    }
}

export type Page = Awaited<ReturnType<typeof page>>

/** A restart: the session area is gone, the disk is not. `restartBound: false` is a web tab's `sessionStorage`. */
export function restart(restartBound = true) {
    installSessionArea({ ...memorySessionArea(), restartBound })
}

/** Empty `localStorage` and databases, as on a device the app never ran on. */
export async function freshDevice() {
    const data = new Map<string, string>()
    vi.stubGlobal('localStorage', {
        getItem: (key: string) => data.get(key) ?? null,
        setItem: (key: string, value: string) => data.set(key, value),
        removeItem: (key: string) => data.delete(key),
    })
    restart()
    for (const name of ['steam-organizer', 'steam-organizer-device'])
        await new Promise((resolve) => {
            indexedDB.deleteDatabase(name).onsuccess = resolve
        })
}
