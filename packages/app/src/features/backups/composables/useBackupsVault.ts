import { readAccount } from '@so/core'
import { computed } from 'vue'

import { useDrive } from '#features/drive'
import { useVaultSession, type VaultContents } from '#features/vault'

import type { BackupsVault } from '../model'

export const countAccounts = (contents: VaultContents | null) =>
    [...(contents?.data.values() ?? [])].filter((data) => readAccount(data))
        .length

/** The open vault as backups see it. */
export function useBackupsVault() {
    const session = useVaultSession()
    const drive = useDrive()

    const vault = computed<BackupsVault | null>(() =>
        session.vault
            ? {
                  name: session.vault.name,
                  accounts: countAccounts(session.contents),
              }
            : null,
    )
    // Without Drive the vault has nowhere to keep backups.
    const onDevice = computed(() => drive.state.value === 'disconnected')

    return { vault, onDevice }
}
