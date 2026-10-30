import { useToast } from '@so/ui'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { reportError, useSettingsLink } from '#core'
import { useDrive, useDriveProblem } from '#features/drive'

/** The connected Google account and the two switches beside the history. */
export function useDriveAccount() {
    const { t } = useI18n()
    const drive = useDrive()
    drive.prepare()
    const { problemOf } = useDriveProblem()
    const toast = useToast()
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
        // A closed Google window is a quiet false; a failure says why.
        connect: () =>
            drive.connect().catch((error) =>
                toast.add({
                    color: 'danger',
                    title: t("Couldn't connect Google Drive"),
                    description: problemOf(error).description,
                }),
            ),
        disconnect: () =>
            drive.disconnect().catch((error) => reportError(error, 'drive')),
    }
}
