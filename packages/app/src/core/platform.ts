import type { GoogleToken } from '@so/core'
import { type InjectionKey, inject } from 'vue'

/** Google sign-in for Drive, which each shell does its own way. */
export interface GoogleAuth {
    /** A token for `DRIVE_SCOPE`; null when the user closed the prompt, or silently there is none to give.
     *  An interactive call must start from a click: it may open Google's window. `hint`: the expected account's email. */
    token(interactive: boolean, hint?: string): Promise<GoogleToken | null>
    revoke(token: string): Promise<void>
    /** Loads ahead what a click needs, so Google's window opens within the click's activation. */
    prepare?(): void
}

/** What the shell can do; each shell entry passes its own. */
export interface Platform {
    kind: 'web' | 'extension'
    /** null: Steam API is unreachable (web has no CORS-free fetch). */
    fetch: typeof fetch | null
    /** null where no Google sign-in runs (the autofill content script). */
    google: GoogleAuth | null
    /** Opens the full app at a route path; absent where the app already is the page. */
    openApp?: (path: string) => void
}

export const PLATFORM: InjectionKey<Platform> = Symbol('platform')

export function usePlatform(): Platform {
    const platform = inject(PLATFORM)
    if (!platform) throw new Error('Platform is not provided')
    return platform
}
