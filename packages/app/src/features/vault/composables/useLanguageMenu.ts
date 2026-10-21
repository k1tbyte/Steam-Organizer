import type { DropdownItem } from '@so/ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useAppearancePref } from '#core'

const LANGUAGES = [
    { value: 'en', label: 'English' },
    { value: 'ru', label: 'Русский' },
] as const

/** The device-local language pref, shared with Settings: only the locale value changes until translations land. */
export function useLanguageMenu() {
    const { locale } = useI18n()
    const language = useAppearancePref('language')

    const items = computed<DropdownItem[]>(() =>
        LANGUAGES.map(({ value, label }) => ({
            label,
            checked: value === language.state.value,
            onSelect() {
                language.set(value)
                locale.value = value
            },
        })),
    )
    const current = computed(
        () =>
            LANGUAGES.find((item) => item.value === language.state.value)
                ?.label,
    )

    return { items, current }
}
