import { ref } from 'vue'

import { useMock } from '#core'
import { useSettingsEntry } from '#features/settings'

import { driveMock } from '../mocks'

/** The connected Google account and the two switches beside the history. */
export function useDriveAccount() {
    const identity = useMock(() => undefined, driveMock)
    const settings = useSettingsEntry()

    // Both switches live in Settings later; here they only flip.
    const autoBackup = ref(true)
    const autoSync = ref(true)

    return {
        identity,
        autoBackup,
        autoSync,
        openSyncSettings: () => settings.open('sync'),
    }
}
