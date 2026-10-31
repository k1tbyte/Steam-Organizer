import { computed } from 'vue'

import { useDrive } from '#features/drive'
import { tally, useVaultSession } from '#features/vault'

import type { BackupsVault } from '../model'

/** The open vault as backups see it. */
export function useBackupsVault() {
    const session = useVaultSession()
    const drive = useDrive()

    const vault = computed<BackupsVault | null>(() =>
        session.vault
            ? {
                  name: session.vault.name,
                  accounts: tally(session.contents).accounts,
              }
            : null,
    )
    // Backups and sync come together: a vault kept on this device has no history.
    const onDevice = computed(
        () => session.vault !== null && !session.vault.sync,
    )
    // A synced vault while Google is signed out: the history is out of reach.
    const needsDrive = computed(
        () => !!session.vault?.sync && drive.state.value === 'disconnected',
    )

    return {
        vault,
        onDevice,
        needsDrive,
        /** The history and Backup now are out of reach. */
        noHistory: computed(() => onDevice.value || needsDrive.value),
    }
}
