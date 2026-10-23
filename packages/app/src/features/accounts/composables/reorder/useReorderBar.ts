import { useDesktopLayout } from '@so/ui'
import { onKeyStroke } from '@vueuse/core'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { usePageActive } from '#core'

import { useReorderMode } from './useReorderMode'
import { useReorderSelection } from './useReorderSelection'

// Esc there belongs to the overlay.
const OVERLAY = '[role="dialog"], [role="menu"], [role="listbox"]'

/** The reorder bar's hint or selection count, and Esc clearing the selection, then leaving the mode. Mounted with the mode even when the grid is not (an empty vault); a drag in the grid takes Esc first. */
export function useReorderBar() {
    const { t } = useI18n()
    const desktop = useDesktopLayout()
    const mode = useReorderMode()
    const selection = useReorderSelection()
    const active = usePageActive()
    onKeyStroke('Escape', (event) => {
        const inOverlay =
            event.target instanceof Element && event.target.closest(OVERLAY)
        if (!active.value || event.defaultPrevented || inOverlay) return
        if (selection.count.value) selection.clear()
        else mode.close()
    })
    const hint = computed(() =>
        desktop.value
            ? t(
                  'Drag cards to reorder them, click to pick several, or move one with the arrow keys',
              )
            : t('Tap cards to pick several, drag by the handle'),
    )
    return {
        picking: computed(() => selection.count.value > 0),
        label: computed(() =>
            selection.count.value
                ? t('{count} selected', { count: selection.count.value })
                : hint.value,
        ),
        clear: selection.clear,
        close: () => mode.close(),
    }
}
