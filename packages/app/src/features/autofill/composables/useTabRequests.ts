import { onScopeDispose } from 'vue'

import { usePlatform } from '#core'
import {
    parseTabRequest,
    type TabContext,
    type TabFillAnswer,
} from '#features/quick-access'

import type { AutofillVault } from './useAutofillVault'
import type { useHostPage } from './useHostPage'

/** What the popup asks of this tab: what the page shows, and a login or code to put in. Heard through
 *  `Platform.onTabRequest`; a login or code comes in the message and goes straight into the fields. */
export function useTabRequests(
    host: ReturnType<typeof useHostPage>,
    vault: AutofillVault,
) {
    const platform = usePlatform()

    function context(): TabContext {
        const kind = host.target.value?.kind
        return {
            kind: kind === 'login' ? 'signin' : (kind ?? 'other'),
            address: `${location.host}${location.pathname}`,
        }
    }

    function answer(message: unknown): TabContext | TabFillAnswer | undefined {
        const request = parseTabRequest(message)
        const kind = host.target.value?.kind
        switch (request?.type) {
            case 'tab:context':
                return context()
            case 'tab:fill-login':
                if (kind !== 'login') return { filled: false }
                host.fillLogin(request.login, request.password)
                void vault.filled(request.id)
                return { filled: true }
            case 'tab:fill-code':
                if (kind !== 'guard') return { filled: false }
                host.fillCode(request.code)
                return { filled: true }
            default:
                return undefined
        }
    }

    const stop = platform.onTabRequest?.(answer)
    if (stop) onScopeDispose(stop)
}
