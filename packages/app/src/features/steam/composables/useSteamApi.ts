import { type SteamApi, steamApi } from '@so/core'

import { usePlatform } from '#core'
import { useVaultSession } from '#features/vault'

import { readSteamKey } from './useSteamKey'

/** The Steam Web API under the vault's key. Web has no CORS-free fetch: `reachable` is false there and nothing may call `api`. */
export function useSteamApi() {
    const { fetch } = usePlatform()
    const session = useVaultSession()
    return {
        reachable: fetch !== null,
        /** The key is read per call, so one saved in Settings meanwhile applies; `key` checks a typed one instead. */
        async api(key?: string): Promise<SteamApi> {
            if (fetch === null) throw new Error('Steam is unreachable here')
            return steamApi(fetch, key ?? (await readSteamKey(session)))
        },
    }
}
