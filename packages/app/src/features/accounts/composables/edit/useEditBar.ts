import { type MenuEntries, useDesktopLayout } from '@so/ui'
import { onKeyStroke } from '@vueuse/core'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { usePageActive } from '#core'

import { useVaultAccounts } from '../useVaultAccounts'
import { useEditMode } from './useEditMode'
import { useEditSelection } from './useEditSelection'

// Esc there belongs to the overlay.
const OVERLAY = '[role="dialog"], [role="menu"], [role="listbox"]'

/** What the bar hands upstream for the picked accounts; nothing listens yet. */
export interface BatchIntents {
    editTags: (ids: string[]) => void
    refresh: (ids: string[]) => void
    export: (ids: string[]) => void
    delete: (ids: string[]) => void
}

/** The edit bar: its hint or selection count, the batch menu, Ctrl/Cmd+A picking every shown card, and Esc clearing the selection, then leaving the mode.
 *  Mounted with the mode even when the grid is not (an empty vault); a drag in the grid takes Esc first. */
export function useEditBar(intents: BatchIntents) {
    const { t } = useI18n()
    const desktop = useDesktopLayout()
    const mode = useEditMode()
    const selection = useEditSelection()
    const vault = useVaultAccounts()
    const active = usePageActive()
    const inOverlay = (event: KeyboardEvent) =>
        event.target instanceof Element && event.target.closest(OVERLAY)
    onKeyStroke('Escape', (event) => {
        if (!active.value || event.defaultPrevented || inOverlay(event)) return
        if (selection.count.value) selection.clear()
        else mode.close()
    })
    // Caps Lock turns the key into 'A'.
    onKeyStroke(['a', 'A'], (event) => {
        const field =
            event.target instanceof Element &&
            event.target.closest('input, textarea, [contenteditable]')
        if (
            !(event.metaKey || event.ctrlKey) ||
            !active.value ||
            field ||
            inOverlay(event)
        )
            return
        event.preventDefault()
        selection.selectAll()
    })

    const hint = computed(() =>
        desktop.value
            ? t('Drag to reorder, click to select')
            : t('Tap to select, drag by the handle'),
    )
    const menu = computed<MenuEntries>(() => {
        const disabled = selection.count.value === 0
        const act = (run: (ids: string[]) => void) => () =>
            run([...selection.ids.value])
        return [
            [
                {
                    label: t('Select all'),
                    icon: 'icon-[lucide--check-check]',
                    onSelect: selection.selectAll,
                },
            ],
            [
                {
                    label: t('Pin to top'),
                    icon: 'icon-[lucide--pin]',
                    disabled,
                    onSelect: act((ids) => vault.setPinned(ids, true)),
                },
                {
                    label: t('Unpin'),
                    icon: 'icon-[lucide--pin-off]',
                    disabled,
                    onSelect: act((ids) => vault.setPinned(ids, false)),
                },
                {
                    label: t('Edit tags'),
                    icon: 'icon-[lucide--tag]',
                    disabled,
                    onSelect: act(intents.editTags),
                },
                {
                    label: t('Refresh from Steam'),
                    icon: 'icon-[lucide--refresh-cw]',
                    disabled,
                    onSelect: act(intents.refresh),
                },
                {
                    label: t('Export'),
                    icon: 'icon-[lucide--download]',
                    disabled,
                    onSelect: act(intents.export),
                },
            ],
            [
                {
                    label: t('Delete'),
                    icon: 'icon-[lucide--trash-2]',
                    color: 'danger',
                    disabled,
                    onSelect: act(intents.delete),
                },
            ],
        ]
    })

    return {
        picking: computed(() => selection.count.value > 0),
        label: computed(() =>
            selection.count.value
                ? t('{count} selected', { count: selection.count.value })
                : hint.value,
        ),
        menu,
        clear: selection.clear,
        close: () => mode.close(),
    }
}
