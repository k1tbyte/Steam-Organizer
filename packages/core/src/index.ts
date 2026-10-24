export type { PasswordSlot, VaultKey } from './crypto/keys'
export type { Sealed } from './crypto/seal'
export { UnsupportedVaultError, WrongPasswordError } from './errors'
export {
    type StoredVault,
    type VaultHome,
    vaultStore,
} from './storage/vaultStore'
export {
    changePassword,
    createVault,
    type LiveRecord,
    type OpenRecord,
    openData,
    openSecret,
    readRecords,
    type SealedRecord,
    sealRecord,
    type Tombstone,
    unlockVault,
    VAULT_FORMAT,
    type VaultFile,
    writeRecords,
} from './vault/vault'
