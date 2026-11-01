import { defineAsyncComponent } from 'vue'

export { useAutoLock } from './composables/useAutoLock'
export { useHelloLabel } from './composables/useHelloLabel'
export { useUndoDelete } from './composables/useUndoDelete'
export { useVaultPlace } from './composables/useVaultPlace'
export {
    type HelloState,
    LOCK_AFTER,
    type LockAfter,
    type LockedSnapshot,
    MAX_VAULT_NAME_LENGTH,
    type MergedCopy,
    type PinState,
    SECURITY_DEFAULTS,
    type SecuritySettings,
    type SyncReceipt,
} from './model'
export { installVaultGuard, vaultRoutes } from './routes'
export { PIN_LENGTH } from './services/pinAttempts'
export { tally, type VaultContents } from './services/vaultContents'
export { useLockPolicy } from './stores/useLockPolicy'
export { useVaultSecurity } from './stores/useVaultSecurity'
export { useVaultSession } from './stores/useVaultSession'

// Lazy: tests that load the session through this facade can't load an SFC.
export const ResetVaultDialog = defineAsyncComponent(
    () => import('./components/reset/ResetVaultDialog.vue'),
)
