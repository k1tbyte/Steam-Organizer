import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useAppearancePref } from '#core'
import { useFieldPlacement, useVaultTags } from '#features/accounts'
import { useVaultServices } from '#features/linked-services'

import type { SectionKey } from '../model'
import { FIELD_KEYS, secretCount } from '../services/fieldSecrecy'
import { useSettingsStore } from '../stores/settingsStore'
import { useDriveSync } from './sources/useDriveSync'
import { useSteamAccess } from './sources/useSteamAccess'
import { useVaultInfo } from './sources/useVaultInfo'
import { useLockAfterOptions } from './useLockAfterOptions'

/** Values on the phone index: each one reads what its section edits. */
export function useSettingsSummary() {
    const { t } = useI18n()
    const mode = useAppearancePref('mode')
    const store = useSettingsStore()
    const { placement } = useFieldPlacement()
    const lock = useLockAfterOptions()
    const vault = useVaultInfo()
    const drive = useDriveSync()
    const steam = useSteamAccess()
    const { tags } = useVaultTags()
    const { own: services } = useVaultServices()

    const modeLabels = computed(() => ({
        dark: t('Dark'),
        light: t('Light'),
        system: t('System'),
    }))

    function summaryOf(key: SectionKey): string {
        switch (key) {
            case 'appearance':
                return modeLabels.value[mode.state.value]
            case 'security':
                return lock.labelOf(store.security.lockAfter)
            case 'sync':
                return store.sync.connected ? t('On') : t('Off')
            case 'fields':
                return t('{count} secret', {
                    count: secretCount(FIELD_KEYS, placement.value),
                })
            case 'tags':
                return String(tags.value.length)
            case 'services':
                return String(services.value.length)
            case 'vault':
                return vault.value?.name ?? ''
            case 'steam':
                return steam.apiKey.value ? t('Key set') : t('Not set')
            case 'bots':
                return t('Soon')
        }
    }

    const vaultName = computed(() => vault.value?.name ?? '')
    const syncLine = computed(() =>
        t('Google Drive · {status}', { status: drive.statusText.value }),
    )

    return { summaryOf, vaultName, syncLine, syncColor: drive.statusColor }
}
