export const STEAM_API = 'https://api.steampowered.com/'

/** A Web API key as Steam issues it: 32 hex digits. */
export const isSteamKey = (key: string) => /^[0-9a-f]{32}$/i.test(key)

export type SteamErrorKind =
    | 'no-key'
    | 'bad-key'
    | 'offline'
    | 'rate-limit'
    | 'server'

export class SteamError extends Error {
    constructor(readonly kind: SteamErrorKind) {
        super(`Steam request failed: ${kind}`)
        this.name = 'SteamError'
    }
}

/** The Steam Web API under one key: `get('ISteamUser/GetPlayerBans/v1/', { steamids })`; an empty key fails every call as `no-key`. */
export interface SteamApi {
    get<T>(path: string, params: Record<string, string>): Promise<T>
}

function failure(status: number): SteamErrorKind {
    if (status === 401 || status === 403) return 'bad-key'
    return status === 429 ? 'rate-limit' : 'server'
}

/** One Steam request (a URL is a GET), its failures as `SteamError`s. */
export async function requestJson<T>(
    fetch: typeof globalThis.fetch,
    request: string | Request,
    kindOf: (status: number) => SteamErrorKind = failure,
): Promise<T> {
    const response = await fetch(request).catch(() => {
        throw new SteamError('offline')
    })
    if (!response.ok) throw new SteamError(kindOf(response.status))
    try {
        return (await response.json()) as T
    } catch {
        throw new SteamError('server')
    }
}

export function steamApi(
    fetch: typeof globalThis.fetch,
    key: string,
): SteamApi {
    return {
        async get<T>(path: string, params: Record<string, string>) {
            if (key === '') throw new SteamError('no-key')
            return requestJson<T>(
                fetch,
                `${STEAM_API}${path}?${new URLSearchParams({ ...params, key })}`,
            )
        },
    }
}
