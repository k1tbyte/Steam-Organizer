import { type InjectionKey, inject } from 'vue'

/** What the shell can do; each shell entry passes its own. */
export interface Platform {
    kind: 'web' | 'extension'
    /** null: Steam API is unreachable (web has no CORS-free fetch). */
    fetch: typeof fetch | null
}

export const PLATFORM: InjectionKey<Platform> = Symbol('platform')

export function usePlatform(): Platform {
    const platform = inject(PLATFORM)
    if (!platform) throw new Error('Platform is not provided')
    return platform
}
