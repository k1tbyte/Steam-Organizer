import { useDesktopLayout } from '@so/ui'
import { onKeyStroke } from '@vueuse/core'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { usePageActive } from '#core'

import { useReorderMode } from './useReorderMode'

// Esc there belongs to the overlay.
const OVERLAY = '[role="dialog"], [role="menu"], [role="listbox"]'

/** The reorder bar's hint, and Esc leaving the mode. Mounted with the mode even when the grid is not (an empty vault); a drag in the grid takes Esc first. */
export function useReorderBar() {
    const { t } = useI18n()
    const desktop = useDesktopLayout()
    const mode = useReorderMode()
    const active = usePageActive()
    onKeyStroke('Escape', (event) => {
        const inOverlay =
            event.target instanceof Element && event.target.closest(OVERLAY)
        if (active.value && !event.defaultPrevented && !inOverlay) mode.close()
    })
    return {
        hint: computed(() =>
            desktop.value
                ? t(
                      'Drag cards to reorder them, or move one with the arrow keys',
                  )
                : t('Drag a card by its handle'),
        ),
        close: () => mode.close(),
    }
}
