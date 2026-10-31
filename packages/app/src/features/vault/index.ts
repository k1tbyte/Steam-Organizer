import { defineAsyncComponent } from 'vue'

export { useUndoDelete } from './composables/useUndoDelete'
export {
    type LockedSnapshot,
    MAX_VAULT_NAME_LENGTH,
    type MergedCopy,
    type SyncReceipt,
} from './model'
export { installVaultGuard, vaultRoutes } from './routes'
export { tally, type VaultContents } from './services/vaultContents'
export { useVaultSession } from './stores/useVaultSession'

// Lazy: tests that load the session through this facade can't load an SFC.
export const ResetVaultDialog = defineAsyncComponent(
    () => import('./components/reset/ResetVaultDialog.vue'),
)
