import type { VaultHome } from '@so/core'
import { useI18n } from 'vue-i18n'

/** Where a vault lives, as the unlock picker and Settings name it: Google Drive once linked, else its home. */
export function useVaultPlace() {
    const { t } = useI18n()
    return (home: VaultHome, synced: boolean) => {
        if (synced) return t('Google Drive')
        return home === 'device' ? t('This device') : t('Folder')
    }
}
