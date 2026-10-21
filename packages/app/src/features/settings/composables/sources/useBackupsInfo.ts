import { useMock } from '#core'

import { backupsMock } from '../../mocks'

/** How many backups Drive holds; wired to the backups feature later. */
export function useBackupsInfo() {
    return useMock(() => undefined, backupsMock)
}
