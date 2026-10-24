import { computed } from 'vue'

import { usePlatform } from '#core'
import { useVaultSession } from '#features/vault'

const VIEW = { unlocked: 'accounts', locked: 'locked', new: 'setup' } as const

/** The popup's chrome: which screen the vault session allows, and the header's actions. */
export function usePopupFrame() {
    const session = useVaultSession()
    void session.load()
    const platform = usePlatform()

    return {
        view: computed(() => VIEW[session.state]),
        unlocked: computed(() => session.state === 'unlocked'),
        lock: session.lock,
        openApp: (path = '/') => platform.openApp?.(path),
    }
}
