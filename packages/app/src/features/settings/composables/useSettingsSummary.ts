import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useAppearancePref } from '#core'
import { useFieldPlacement, useVaultTags } from '#features/accounts'
import { useVaultServices } from '#features/linked-services'
import { useSteamKey } from '#features/steam'
import { useVaultPlace, useVaultSession } from '#features/vault'

import type { SectionKey } from '../model'
import { FIELD_KEYS, secretCount } from '../services/fieldSecrecy'
import { useSettingsStore } from '../stores/settingsStore'
import { useDriveSync } from './sources/useDriveSync'
import { useLockAfterOptions } from './useLockAfterOptions'

/** The phone index: each value reads what its section edits, and the vault card locks. */
export function useSettingsSummary() {
    const { t } = useI18n()
    const mode = useAppearancePref('mode')
    const store = useSettingsStore()
    const { placement } = useFieldPlacement()
    const lock = useLockAfterOptions()
    const session = useVaultSession()
    const placeOf = useVaultPlace()
    const drive = useDriveSync()
    const steam = useSteamKey()
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
                return drive.connected.value ? t('On') : t('Off')
            case 'fields':
                return t('{count} secret', {
                    count: secretCount(FIELD_KEYS, placement.value),
                })
            case 'tags':
                return String(tags.value.length)
            case 'services':
                return String(services.value.length)
            case 'vault':
                return session.vault?.name ?? ''
            case 'steam':
                return steam.key.value ? t('Key set') : t('Not set')
            case 'bots':
                return t('Soon')
        }
    }

    const vaultName = computed(() => session.vault?.name ?? '')
    const vaultLine = computed(() => {
        const vault = session.vault
        if (!vault?.sync) return vault ? placeOf(vault.home, false) : ''
        return t('Google Drive · {status}', { status: drive.statusText.value })
    })
    // The dot is the sync status: a vault kept on this device alone has none.
    const syncColor = computed(() =>
        session.vault?.sync ? drive.statusColor.value : undefined,
    )

    return {
        summaryOf,
        vaultName,
        vaultLine,
        syncColor,
        lock: session.lock,
    }
}
