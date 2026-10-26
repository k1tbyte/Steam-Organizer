import { useToast } from '@so/ui'
import { onScopeDispose } from 'vue'

import { useVaultSession } from '#features/vault'

/** An Undo or a copied secret belongs to the open vault: a lock drops every toast. The shell calls it once. */
export function useLockClearsToasts() {
    onScopeDispose(useVaultSession().onBeforeLock(useToast().clear))
}
