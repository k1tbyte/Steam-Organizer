import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { reportError, useSettingsLink } from '#core'
import { useDrive, useDriveSignIn } from '#features/drive'

import { useVaultSync } from '../stores/useVaultSync'

/** The connected Google account, the two switches beside the history and Retry for a failed sync. */
export function useDriveAccount() {
    const { t } = useI18n()
    const drive = useDrive()
    drive.prepare()
    const signIn = useDriveSignIn()
    const openSettings = useSettingsLink()
    const engine = useVaultSync()

    const setting = <K extends 'autoBackup' | 'autoSync'>(key: K) =>
        computed({
            get: () => engine.settings[key],
            set: (on: boolean) => engine.setSettings({ [key]: on }),
        })

    return {
        identity: drive.account,
        connecting: drive.connecting,
        autoBackup: setting('autoBackup'),
        autoSync: setting('autoSync'),
        syncLine: computed(() =>
            t('On focus and every {minutes} min', {
                minutes: engine.settings.interval,
            }),
        ),
        openSyncSettings: () => openSettings('sync'),
        retrySync: () => void engine.syncNow(),
        connect: () => void signIn(),
        disconnect: () =>
            drive.disconnect().catch((error) => reportError(error, 'drive')),
    }
}
