import type { VaultHostServe } from '#features/autofill'

import type { Platform } from './core'
import { createEntry } from './entry'
import VaultHost from './VaultHost.vue'

export {
    type HostHandler,
    tabFillKey,
    type VaultHostServe,
} from '#features/autofill'

/** The vault host: the app's own session, headless, on a detached root. The shell passes the transport its content
 *  scripts reach it by (`serve`); the page it runs in is one more page of the session. */
export function mountVaultHost(platform: Platform, serve: VaultHostServe) {
    return createEntry(VaultHost, platform, undefined, { serve }).mount(
        document.createElement('div'),
    )
}
