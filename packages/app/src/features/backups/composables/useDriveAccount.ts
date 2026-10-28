import { ref } from 'vue'

import { reportError, useSettingsLink } from '#core'
import { useDrive } from '#features/drive'

/** The connected Google account and the two switches beside the history. */
export function useDriveAccount() {
    const drive = useDrive()
    drive.prepare()
    const openSettings = useSettingsLink()

    // Both switches live in Settings later; here they only flip.
    const autoBackup = ref(true)
    const autoSync = ref(true)

    return {
        identity: drive.account,
        connecting: drive.connecting,
        autoBackup,
        autoSync,
        openSyncSettings: () => openSettings('sync'),
        signInAgain: () =>
            drive.connect().catch((error) => reportError(error, 'drive')),
        disconnect: () =>
            drive.disconnect().catch((error) => reportError(error, 'drive')),
    }
}
