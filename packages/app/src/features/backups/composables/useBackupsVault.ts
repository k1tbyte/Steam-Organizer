import { computed } from 'vue'

import { useMock } from '#core'

import { vaultMock } from '../mocks'

/** The open vault as backups see it; waits on the vault feature. */
export function useBackupsVault() {
    const vault = useMock(() => undefined, vaultMock)
    const onDevice = computed(() => vault.value?.location === 'device')

    return { vault, onDevice }
}
