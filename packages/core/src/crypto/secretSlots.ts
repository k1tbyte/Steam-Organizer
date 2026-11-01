import { UnsupportedVaultError } from '../errors'
import {
    checked,
    derive,
    importRoot,
    type Kdf,
    masterRoot,
    passwordBits,
    type VaultKey,
    vaultKey,
} from './kdf'
import { gcm, type Sealed, splitSealed } from './seal'

const SECRET_BYTES = 32
const GCM_TAG_BYTES = 16
const IV_BYTES = 12
const AES = { name: 'AES-GCM', length: 256 } as const

export const PASSWORD_SLOT = 'slot:password'
const DEVICE_SLOT = 'slot:device'
const PIN_SLOT = 'slot:pin'
const PRF_SLOT = 'slot:prf'

/** What wraps the vault secret: a key, and the info that binds the wrapped blob to its slot (its AAD). */
export interface SecretWrap {
    key: CryptoKey
    info: string
}

/** The vault secret sealed under `wrap`: the master password, this device, a PIN or a passkey each give one. */
export interface SecretSlot extends SecretWrap {
    sealed: Sealed
}

// A slot of another size is damaged: the GCM tag would fail it as a wrong key.
export function secretParts(sealed: Sealed) {
    const parts = splitSealed(sealed)
    if (parts.cipher.length !== SECRET_BYTES + GCM_TAG_BYTES)
        throw new UnsupportedVaultError()
    return parts
}

export const slotOf = (wrap: SecretWrap, sealed: Sealed): SecretSlot => ({
    ...wrap,
    sealed,
})

/** One PBKDF2 over the master password; the slot then opens the vault and moves the secret. */
export async function passwordSecretSlot(
    slot: { kdf: Kdf; key: Sealed },
    password: string,
): Promise<SecretSlot> {
    secretParts(slot.key)
    const root = await masterRoot(password, slot.kdf)
    return slotOf(
        {
            key: await derive(root, PASSWORD_SLOT, ['unwrapKey']),
            info: PASSWORD_SLOT,
        },
        slot.key,
    )
}

/** Random, non-extractable, made once per device: a slot under it never leaves this device. */
export const createDeviceKey = () =>
    crypto.subtle.generateKey(AES, false, ['wrapKey', 'unwrapKey'])

export const deviceWrap = (key: CryptoKey): SecretWrap => ({
    key,
    info: DEVICE_SLOT,
})

async function bitsWrap(
    bits: Uint8Array<ArrayBuffer>,
    info: string,
): Promise<SecretWrap> {
    const root = await importRoot(bits)
    return { key: await derive(root, info, ['wrapKey', 'unwrapKey']), info }
}

/** PBKDF2 over the PIN with the slot's own salt; the bits are zeroed here. */
export async function pinWrap(pin: string, kdf: Kdf): Promise<SecretWrap> {
    const bits = await passwordBits(pin, kdf)
    try {
        return await bitsWrap(bits, PIN_SLOT)
    } finally {
        bits.fill(0)
    }
}

/** From PBKDF2 bits kept sealed apart (the restart re-arm); the caller zeroes them. */
export const pinWrapFromBits = (bits: Uint8Array<ArrayBuffer>) =>
    bitsWrap(bits, PIN_SLOT)

/** From the 32 bytes a passkey's PRF returned; the caller zeroes them. */
export const prfWrap = (bits: Uint8Array<ArrayBuffer>) =>
    bitsWrap(bits, PRF_SLOT)

/** Unwraps into a non-extractable HKDF root, so opening a slot never puts the secret in script memory.
 *  A wrong key is `WrongPasswordError`. */
export async function openSecretSlot(slot: SecretSlot): Promise<VaultKey> {
    const { iv, cipher } = secretParts(slot.sealed)
    const root = await checked(
        crypto.subtle.unwrapKey(
            'raw',
            cipher,
            slot.key,
            gcm(iv, slot.info),
            'HKDF',
            false,
            ['deriveKey'],
        ),
    )
    return vaultKey(root)
}

/** The secret from one slot into another: an extractable AES key that only `wrapKey` reads, so its bytes never sit
 *  in script memory. */
export async function resealSecretSlot(
    from: SecretSlot,
    to: SecretWrap,
): Promise<Sealed> {
    const { iv, cipher } = secretParts(from.sealed)
    const secret = await checked(
        crypto.subtle.unwrapKey(
            'raw',
            cipher,
            from.key,
            gcm(iv, from.info),
            AES,
            true,
            ['encrypt'],
        ),
    )
    const fresh = crypto.getRandomValues(new Uint8Array(IV_BYTES))
    const wrapped = new Uint8Array(
        await crypto.subtle.wrapKey('raw', secret, to.key, gcm(fresh, to.info)),
    )
    const out = new Uint8Array(IV_BYTES + wrapped.length)
    out.set(fresh)
    out.set(wrapped, IV_BYTES)
    return out.toBase64()
}
