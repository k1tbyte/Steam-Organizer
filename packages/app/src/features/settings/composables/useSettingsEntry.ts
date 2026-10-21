import { useDesktopLayout } from '@so/ui'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import type { SectionKey } from '../model'
import { useSettingsOverlay } from './useSettingsOverlay'

/** What the shell needs: is settings showing, and open it as a window or as the phone screen. */
export function useSettingsEntry() {
    const desktop = useDesktopLayout()
    const route = useRoute()
    const router = useRouter()
    const overlay = useSettingsOverlay()

    const active = computed(() =>
        desktop.value ? overlay.open.value : route.path.startsWith('/settings'),
    )

    function open(section?: SectionKey) {
        if (desktop.value) overlay.show(section)
        else void router.push(section ? `/settings/${section}` : '/settings')
    }

    return { active, open }
}
