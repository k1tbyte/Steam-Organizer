import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useAppearancePref, useMock } from '#core'

import { summaryMock } from '../mocks'
import type { SectionKey } from '../model'

/** Values on the phone index: each waits on its section's own setting. */
export function useSettingsSummary() {
    const { t } = useI18n()
    const mode = useAppearancePref('mode')
    const summary = useMock(() => undefined, summaryMock)

    const modeLabels = computed(() => ({
        dark: t('Dark'),
        light: t('Light'),
        system: t('System'),
    }))

    function summaryOf(key: SectionKey): string {
        if (key === 'appearance') return modeLabels.value[mode.state.value]
        if (key === 'bots') return t('Soon')
        return summary.value?.values[key] ?? ''
    }

    const vaultName = computed(() => summary.value?.vaultName ?? '')
    const syncLine = computed(() => summary.value?.syncLine ?? '')

    return { summaryOf, vaultName, syncLine }
}
