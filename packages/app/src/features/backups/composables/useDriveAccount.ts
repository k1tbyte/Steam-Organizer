import { ref } from 'vue'

import { useMock, useSettingsLink } from '#core'

import { driveMock } from '../mocks'

/** The connected Google account and the two switches beside the history. */
export function useDriveAccount() {
    const identity = useMock(() => undefined, driveMock)
    const openSettings = useSettingsLink()

    // Both switches live in Settings later; here they only flip.
    const autoBackup = ref(true)
    const autoSync = ref(true)

    return {
        identity,
        autoBackup,
        autoSync,
        openSyncSettings: () => openSettings('sync'),
    }
}
