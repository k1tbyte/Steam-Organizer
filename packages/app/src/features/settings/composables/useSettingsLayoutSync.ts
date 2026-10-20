import { useDesktopLayout } from '@so/ui'
import { watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import type { SectionKey } from '../model'
import { useSettingsOverlay } from './useSettingsOverlay'

// The page under the window while it is a phone screen, so widening again closes onto the same page.
let background = '/'

/** A window on desktop and screens on phones: crossing the breakpoint carries the section over. */
export function useSettingsLayoutSync() {
    const desktop = useDesktopLayout()
    const route = useRoute()
    const router = useRouter()
    const overlay = useSettingsOverlay()

    watchEffect(() => {
        const onScreen = route.path.startsWith('/settings')
        if (desktop.value && onScreen) {
            const { section } = route.params
            const target = router.resolve(
                overlay.to(
                    typeof section === 'string'
                        ? (section as SectionKey)
                        : undefined,
                ),
            )
            void router.replace({
                path: background,
                query: target.query,
                hash: target.hash,
            })
            background = '/'
        } else if (!desktop.value && overlay.open.value) {
            background = route.path
            void router.replace(`/settings/${overlay.value.value}`)
        }
    })
}
