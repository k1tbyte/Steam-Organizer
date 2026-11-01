import {
    newerSlots,
    passwordSecretSlot,
    readRecords,
    type SecretSlot,
    unlockVaultWith,
    type VaultFile,
    type VaultKey,
    WrongPasswordError,
    withRecovery,
} from '@so/core'

import { reportError } from '../../../core/reportError'
import type { UnlockResult } from '../model'
import { openContents, type VaultContents } from './vaultContents'

export interface OpenedVault {
    key: VaultKey
    contents: VaultContents
    /** The file with a recovery slot added, to store. */
    upgraded?: VaultFile
}

/** Opens the records. A vault made before recovery slots gets one, from the password that opened these slots. */
export async function openVault(
    file: VaultFile,
    key: VaultKey,
    password?: string,
): Promise<OpenedVault> {
    const contents = await openContents(key, file)
    const upgraded =
        password === undefined ? null : await withRecovery(file, key, password)
    return upgraded
        ? { key: upgraded.key, contents, upgraded: upgraded.file }
        : { key, contents }
}

/** The slot `password` makes of the file's password slot (the one PBKDF2), or `unreadable` for a damaged one. */
export async function passwordSlotOf(
    file: VaultFile,
    password: string,
): Promise<SecretSlot | 'unreadable'> {
    try {
        return await passwordSecretSlot(file.slots.password, password)
    } catch (error) {
        reportError(error, 'vault-session', { vault: file.id })
        return 'unreadable'
    }
}

/** The key `slot` unwraps from `file`, or why it does not. */
export async function opens(
    file: VaultFile,
    slot: SecretSlot,
): Promise<VaultKey | Exclude<UnlockResult, 'opened'>> {
    try {
        return await unlockVaultWith(file, slot)
    } catch (error) {
        if (error instanceof WrongPasswordError) return 'wrong'
        reportError(error, 'vault-session', { vault: file.id })
        return 'unreadable'
    }
}

/** The key and the slot `password` makes of `file`, which later moves the secret under the device key. */
export async function opensPassword(
    file: VaultFile,
    password: string,
): Promise<
    { key: VaultKey; slot: SecretSlot } | Exclude<UnlockResult, 'opened'>
> {
    const slot = await passwordSlotOf(file, password)
    if (typeof slot === 'string') return slot
    const key = await opens(file, slot)
    return typeof key === 'string' ? key : { key, slot }
}

/** This device's file for a key its Drive copy's slots unwrapped (a password changed on another device): with the
 *  later of both slots, or `wrong` when the key does not open it. */
export async function withCopySlots(
    file: VaultFile,
    key: VaultKey,
    copy: VaultFile,
): Promise<VaultFile | 'wrong'> {
    const ours = await readRecords(key, file).then(
        () => true,
        () => false,
    )
    return ours
        ? { ...file, slots: newerSlots(file.slots, copy.slots) }
        : 'wrong'
}
