import { useMock } from '#core'

import { vaultMock } from '../../mocks'

/** The open vault's name and counts; wired to the vault feature later. */
export function useVaultInfo() {
    return useMock(() => undefined, vaultMock)
}
