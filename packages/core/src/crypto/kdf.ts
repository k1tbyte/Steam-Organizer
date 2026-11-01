import { WrongPasswordError } from '../errors'

const ITERATIONS = 600_000
const SALT_BYTES = 16
const text = new TextEncoder()

export interface Kdf {
    name: 'PBKDF2-SHA-256'
    iterations: number
    salt: string
}

/** The unlocked vault; no key is extractable. The root stays for keys derived later (locked accounts). */
export interface VaultKey {
    readonly root: CryptoKey
    readonly records: CryptoKey
    /** HMAC for `loginTag`. */
    readonly logins: CryptoKey
    /** Public: seals locked accounts' recovery slots, never opens one. */
    readonly recovery?: CryptoKey
}

export const newKdf = (): Kdf => ({
    name: 'PBKDF2-SHA-256',
    iterations: ITERATIONS,
    salt: crypto.getRandomValues(new Uint8Array(SALT_BYTES)).toBase64(),
})

export function derive(
    root: CryptoKey,
    info: string,
    usages: KeyUsage[],
    algorithm: AesKeyGenParams | HmacImportParams = {
        name: 'AES-GCM',
        length: 256,
    },
) {
    return crypto.subtle.deriveKey(
        {
            name: 'HKDF',
            hash: 'SHA-256',
            salt: new Uint8Array(),
            info: text.encode(info),
        },
        root,
        algorithm,
        false,
        usages,
    )
}

export const importRoot = (secret: Uint8Array<ArrayBuffer>) =>
    crypto.subtle.importKey('raw', secret, 'HKDF', false, ['deriveKey'])

/** PBKDF2 over a password or a PIN. Callers zero the bits once used. */
export async function passwordBits(password: string, kdf: Kdf) {
    const material = await crypto.subtle.importKey(
        'raw',
        text.encode(password),
        'PBKDF2',
        false,
        ['deriveBits'],
    )
    return new Uint8Array(
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
}

/** An HKDF root over the master password: the password and recovery slots derive their keys from it. */
export async function masterRoot(password: string, kdf: Kdf) {
    const bits = await passwordBits(password, kdf)
    try {
        return await importRoot(bits)
    } finally {
        bits.fill(0)
    }
}

/** The keys a vault root derives: records, login tags. */
export async function vaultKey(root: CryptoKey): Promise<VaultKey> {
    return {
        root,
        records: await derive(root, 'records', ['encrypt', 'decrypt']),
        logins: await derive(root, 'login-tag', ['sign'], {
            name: 'HMAC',
            hash: 'SHA-256',
        }),
    }
}

// On a well-formed slot only a wrong key fails the GCM tag.
export async function checked<T>(attempt: Promise<T>): Promise<T> {
    try {
        return await attempt
    } catch (error) {
        if (error instanceof DOMException && error.name === 'OperationError')
            throw new WrongPasswordError()
        throw error
    }
}
