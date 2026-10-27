import { UnsupportedVaultError } from '../errors'
import {
    checked,
    type Kdf,
    newKdf,
    openRecovery,
    type PasswordSlot,
    passwordBits,
    slotParts,
    type VaultKey,
    type VaultSlots,
} from './keys'
import { gcm, sealBytes } from './seal'

const KEY_BYTES = 32
const AES = { name: 'AES-GCM', length: 256 } as const
const text = new TextEncoder()

/** An account key's slots: its own password, and recovery through the vault's master password when on. */
export interface AccountSlots {
    password: PasswordSlot
    /** RSA-OAEP of the account key under the vault's recovery key, base64. */
    recovery?: string
}

/** How the user opens a locked account: its own password, or the master password where recovery is on. */
export type AccountCredential = { password: string } | { master: string }

const passwordAad = (id: string) => `account:${id}:password`
const recoveryParams = (id: string): RsaOaepParams => ({
    name: 'RSA-OAEP',
    label: text.encode(`account:${id}:recovery`),
})

/** Needs the vault key and the password both: a copied vault file alone gives a PIN nothing to brute force. */
async function wrappingKey(
    vault: VaultKey,
    id: string,
    password: string,
    kdf: Kdf,
) {
    const bits = await passwordBits(password, kdf)
    try {
        return await crypto.subtle.deriveKey(
            {
                name: 'HKDF',
                hash: 'SHA-256',
                salt: bits,
                info: text.encode(`account:${id}`),
            },
            vault.root,
            AES,
            false,
            ['encrypt', 'decrypt', 'unwrapKey'],
        )
    } finally {
        bits.fill(0)
    }
}

async function passwordSlot(
    vault: VaultKey,
    id: string,
    raw: Uint8Array<ArrayBuffer>,
    password: string,
): Promise<PasswordSlot> {
    const kdf = newKdf()
    const key = await wrappingKey(vault, id, password, kdf)
    return { kdf, key: await sealBytes(key, raw, passwordAad(id)) }
}

const importAccountKey = (raw: Uint8Array<ArrayBuffer>) =>
    crypto.subtle.importKey('raw', raw, AES, false, ['encrypt', 'decrypt'])

/** A new account key: the recovery slot needs the vault's recovery key. */
export async function createAccountKey(
    vault: VaultKey,
    id: string,
    password: string,
    recovery: boolean,
): Promise<{ key: CryptoKey; slots: AccountSlots }> {
    if (recovery && !vault.recovery) throw new UnsupportedVaultError()
    const raw = crypto.getRandomValues(new Uint8Array(KEY_BYTES))
    try {
        const slots: AccountSlots = {
            password: await passwordSlot(vault, id, raw, password),
        }
        if (recovery && vault.recovery)
            slots.recovery = new Uint8Array(
                await crypto.subtle.encrypt(
                    recoveryParams(id),
                    vault.recovery,
                    raw,
                ),
            ).toBase64()
        return { key: await importAccountKey(raw), slots }
    } finally {
        raw.fill(0)
    }
}

// What opens the account key for a credential: the password slot's key, or the recovery private key.
async function opening(
    vault: VaultKey,
    vaultSlots: VaultSlots,
    id: string,
    slots: AccountSlots,
    credential: AccountCredential,
) {
    if ('password' in credential) {
        const { iv, cipher } = slotParts(slots.password)
        const key = await wrappingKey(
            vault,
            id,
            credential.password,
            slots.password.kdf,
        )
        return { key, cipher, params: gcm(iv, passwordAad(id)) }
    }
    if (!slots.recovery) throw new UnsupportedVaultError()
    return {
        key: await openRecovery(vaultSlots, credential.master),
        cipher: Uint8Array.fromBase64(slots.recovery),
        params: recoveryParams(id),
    }
}

/** Unwraps straight into a non-extractable key. A wrong password throws `WrongPasswordError`. */
export async function openAccountKey(
    vault: VaultKey,
    vaultSlots: VaultSlots,
    id: string,
    slots: AccountSlots,
    credential: AccountCredential,
): Promise<CryptoKey> {
    const { key, cipher, params } = await opening(
        vault,
        vaultSlots,
        id,
        slots,
        credential,
    )
    return checked(
        crypto.subtle.unwrapKey('raw', cipher, key, params, AES, false, [
            'encrypt',
            'decrypt',
        ]),
    )
}

/** Rewraps the account key under a new password; the recovery slot stays. */
export async function changeAccountPassword(
    vault: VaultKey,
    vaultSlots: VaultSlots,
    id: string,
    slots: AccountSlots,
    credential: AccountCredential,
    next: string,
): Promise<AccountSlots> {
    const { key, cipher, params } = await opening(
        vault,
        vaultSlots,
        id,
        slots,
        credential,
    )
    const raw = new Uint8Array(
        await checked(crypto.subtle.decrypt(params, key, cipher)),
    )
    try {
        return { ...slots, password: await passwordSlot(vault, id, raw, next) }
    } finally {
        raw.fill(0)
    }
}
