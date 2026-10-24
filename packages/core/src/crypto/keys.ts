import { UnsupportedVaultError, WrongPasswordError } from '../errors'
import { gcm, type Sealed, sealBytes, splitSealed } from './seal'

const ITERATIONS = 600_000
const SECRET_BYTES = 32
const TAG_BYTES = 16
const SALT_BYTES = 16
const SLOT = 'slot:password'
const text = new TextEncoder()

/** The unlocked vault; neither key is extractable. The root stays for keys derived later (locked accounts). */
export interface VaultKey {
    readonly root: CryptoKey
    readonly records: CryptoKey
}

/** The vault secret, wrapped by a key derived from the master password. */
export interface PasswordSlot {
    kdf: { name: 'PBKDF2-SHA-256'; iterations: number; salt: string }
    key: Sealed
}

function derive(root: CryptoKey, info: string, usages: KeyUsage[]) {
    return crypto.subtle.deriveKey(
        {
            name: 'HKDF',
            hash: 'SHA-256',
            salt: new Uint8Array(),
            info: text.encode(info),
        },
        root,
        { name: 'AES-GCM', length: 256 },
        false,
        usages,
    )
}

const importRoot = (secret: Uint8Array<ArrayBuffer>) =>
    crypto.subtle.importKey('raw', secret, 'HKDF', false, ['deriveKey'])

async function slotKey(password: string, kdf: PasswordSlot['kdf']) {
    const material = await crypto.subtle.importKey(
        'raw',
        text.encode(password),
        'PBKDF2',
        false,
        ['deriveBits'],
    )
    const bits = new Uint8Array(
        await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                hash: 'SHA-256',
                salt: Uint8Array.fromBase64(kdf.salt),
                iterations: kdf.iterations,
            },
            material,
            256,
        ),
    )
    // An HKDF root, so recovery slots of locked accounts derive their own key from the same password.
    const root = await importRoot(bits)
    bits.fill(0)
    return derive(root, SLOT, ['encrypt', 'decrypt', 'unwrapKey'])
}

async function vaultKey(root: CryptoKey): Promise<VaultKey> {
    return {
        root,
        records: await derive(root, 'records', ['encrypt', 'decrypt']),
    }
}

async function passwordSlot(
    secret: Uint8Array<ArrayBuffer>,
    password: string,
): Promise<PasswordSlot> {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
    const kdf = {
        name: 'PBKDF2-SHA-256' as const,
        iterations: ITERATIONS,
        salt: salt.toBase64(),
    }
    return {
        kdf,
        key: await sealBytes(await slotKey(password, kdf), secret, SLOT),
    }
}

// A slot of another size is damaged: the GCM tag would fail it as a wrong password.
function slotParts(slot: PasswordSlot) {
    const parts = splitSealed(slot.key)
    if (parts.cipher.length !== SECRET_BYTES + TAG_BYTES)
        throw new UnsupportedVaultError()
    return parts
}

// On a well-formed slot only a wrong password fails the GCM tag.
async function checked<T>(attempt: Promise<T>): Promise<T> {
    try {
        return await attempt
    } catch (error) {
        if (error instanceof DOMException && error.name === 'OperationError')
            throw new WrongPasswordError()
        throw error
    }
}

export async function createKeys(password: string) {
    const secret = crypto.getRandomValues(new Uint8Array(SECRET_BYTES))
    try {
        const slot = await passwordSlot(secret, password)
        return { slot, key: await vaultKey(await importRoot(secret)) }
    } finally {
        secret.fill(0)
    }
}

/** Unwraps straight into a non-extractable root: an unlock never puts the secret in script memory. */
export async function unlockSlot(
    slot: PasswordSlot,
    password: string,
): Promise<VaultKey> {
    const { iv, cipher } = slotParts(slot)
    const root = await checked(
        crypto.subtle.unwrapKey(
            'raw',
            cipher,
            await slotKey(password, slot.kdf),
            gcm(iv, SLOT),
            'HKDF',
            false,
            ['deriveKey'],
        ),
    )
    return vaultKey(root)
}

/** The one place the secret is in script memory after creation, and only behind the old password. */
export async function rewrapSlot(
    slot: PasswordSlot,
    oldPassword: string,
    newPassword: string,
): Promise<PasswordSlot> {
    const { iv, cipher } = slotParts(slot)
    const secret = new Uint8Array(
        await checked(
            crypto.subtle.decrypt(
                gcm(iv, SLOT),
                await slotKey(oldPassword, slot.kdf),
                cipher,
            ),
        ),
    )
    try {
        return await passwordSlot(secret, newPassword)
    } finally {
        secret.fill(0)
    }
}
