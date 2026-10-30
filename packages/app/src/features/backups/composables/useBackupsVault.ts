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
    // Without Drive the vault has nowhere to keep backups.
    const onDevice = computed(() => drive.state.value === 'disconnected')

    return { vault, onDevice }
}
