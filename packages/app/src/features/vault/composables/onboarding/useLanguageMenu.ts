import type { MenuGroup } from '@so/ui'
import { computed } from 'vue'

import { LANGUAGE_NAMES, type PrefValue, useAppearancePref } from '#core'

/** The device-local language pref, the same one Settings › Appearance edits. */
export function useLanguageMenu() {
    const language = useAppearancePref('language')

    const items = computed<MenuGroup[]>(() => [
        {
            choice: 'list',
            value: language.state.value,
            items: Object.entries(LANGUAGE_NAMES).map(([value, label]) => ({
                key: value,
                label,
                onSelect: () => language.set(value as PrefValue<'language'>),
            })),
        },
    ])
    const current = computed(() => LANGUAGE_NAMES[language.state.value])

    return { items, current }
}
