import { UnsupportedVaultError, WrongPasswordError } from '../errors'
import { gcm, type Sealed, sealBytes, splitSealed } from './seal'

const ITERATIONS = 600_000
const SECRET_BYTES = 32
const TAG_BYTES = 16
const SALT_BYTES = 16
const SLOT = 'slot:password'
const RECOVERY = 'slot:recovery'
const RSA: RsaHashedImportParams = { name: 'RSA-OAEP', hash: 'SHA-256' }
const text = new TextEncoder()

/** The unlocked vault; no key is extractable. The root stays for keys derived later (locked accounts). */
export interface VaultKey {
    readonly root: CryptoKey
    readonly records: CryptoKey
    /** HMAC for `loginTag`. */
    readonly logins: CryptoKey
    /** Public: seals locked accounts' recovery slots, never opens one. */
    readonly recovery?: CryptoKey
}

export interface Kdf {
    name: 'PBKDF2-SHA-256'
    iterations: number
    salt: string
}

/** The vault secret, wrapped by a key derived from the master password. */
export interface PasswordSlot {
    kdf: Kdf
    key: Sealed
}

/** A key pair for locked accounts' recovery: the private half opens only with the master password. */
export interface RecoverySlot {
    /** SPKI, base64. */
    publicKey: string
    /** PKCS#8 sealed under the master password. */
    privateKey: Sealed
}

export type VaultSlots = {
    password: PasswordSlot
    recovery?: RecoverySlot
    /** When the master password slots last changed here; a created vault has none (0). Of two copies the later change wins. */
    changedAt?: number
}

type MasterSlots = { password: PasswordSlot; recovery: RecoverySlot }

function derive(
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

const importRoot = (secret: Uint8Array<ArrayBuffer>) =>
    crypto.subtle.importKey('raw', secret, 'HKDF', false, ['deriveKey'])

/** The Steam ID's tag, for an everything lock that hides the ID: a login holds no colon, so the two never collide. */
export const steamTag = (key: VaultKey, steamId: string) =>
    loginTag(key, `steam:${steamId}`)

export const newKdf = (): Kdf => ({
    name: 'PBKDF2-SHA-256',
    iterations: ITERATIONS,
    salt: crypto.getRandomValues(new Uint8Array(SALT_BYTES)).toBase64(),
})

/** Callers zero the bits once used. */
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
async function masterRoot(password: string, kdf: Kdf) {
    const bits = await passwordBits(password, kdf)
    try {
        return await importRoot(bits)
    } finally {
        bits.fill(0)
    }
}

const slotKey = (root: CryptoKey) =>
    derive(root, SLOT, ['encrypt', 'decrypt', 'unwrapKey'])
const recoveryKey = (root: CryptoKey) =>
    derive(root, RECOVERY, ['encrypt', 'decrypt', 'unwrapKey'])

async function vaultKey(root: CryptoKey): Promise<VaultKey> {
    return {
        root,
        records: await derive(root, 'records', ['encrypt', 'decrypt']),
        logins: await derive(root, 'login-tag', ['sign'], {
            name: 'HMAC',
            hash: 'SHA-256',
        }),
    }
}

/** The login's tag: 16 bytes of its HMAC, case and outer spaces ignored as Steam ignores them. */
export async function loginTag(key: VaultKey, login: string): Promise<string> {
    const normalized = text.encode(login.trim().toLowerCase())
    const mac = await crypto.subtle.sign('HMAC', key.logins, normalized)
    return new Uint8Array(mac, 0, TAG_BYTES).toBase64()
}

async function newRecovery(root: CryptoKey): Promise<RecoverySlot> {
    const pair = await crypto.subtle.generateKey(
        {
            ...RSA,
            modulusLength: 3072,
            publicExponent: new Uint8Array([1, 0, 1]),
        },
        true,
        ['encrypt', 'decrypt'],
    )
    const [spki, pkcs8] = await Promise.all([
        crypto.subtle.exportKey('spki', pair.publicKey),
        crypto.subtle.exportKey('pkcs8', pair.privateKey),
    ])
    return sealRecovery(root, new Uint8Array(spki), new Uint8Array(pkcs8))
}

async function sealRecovery(
    root: CryptoKey,
    spki: Uint8Array<ArrayBuffer>,
    pkcs8: Uint8Array<ArrayBuffer>,
): Promise<RecoverySlot> {
    try {
        return {
            publicKey: spki.toBase64(),
            privateKey: await sealBytes(
                await recoveryKey(root),
                pkcs8,
                RECOVERY,
            ),
        }
    } finally {
        pkcs8.fill(0)
    }
}

/** A fresh password slot, and a recovery slot that is new or carried over from the old master password. */
async function masterSlots(
    secret: Uint8Array<ArrayBuffer>,
    password: string,
    recovery: (root: CryptoKey) => Promise<RecoverySlot>,
): Promise<MasterSlots> {
    const kdf = newKdf()
    const root = await masterRoot(password, kdf)
    return {
        password: {
            kdf,
            key: await sealBytes(await slotKey(root), secret, SLOT),
        },
        recovery: await recovery(root),
    }
}

export const importRecovery = (slot: RecoverySlot) =>
    crypto.subtle.importKey(
        'spki',
        Uint8Array.fromBase64(slot.publicKey),
        RSA,
        false,
        ['encrypt'],
    )

/** The recovery private key, opened by the master password typed again: PIN and biometrics never reach it. */
export async function openRecovery(slots: VaultSlots, password: string) {
    if (!slots.recovery) throw new UnsupportedVaultError()
    const { iv, cipher } = splitSealed(slots.recovery.privateKey)
    const root = await masterRoot(password, slots.password.kdf)
    return checked(
        crypto.subtle.unwrapKey(
            'pkcs8',
            cipher,
            await recoveryKey(root),
            gcm(iv, RECOVERY),
            RSA,
            false,
            ['decrypt', 'unwrapKey'],
        ),
    )
}

// A slot of another size is damaged: the GCM tag would fail it as a wrong password.
export function slotParts(slot: PasswordSlot) {
    const parts = splitSealed(slot.key)
    if (parts.cipher.length !== SECRET_BYTES + TAG_BYTES)
        throw new UnsupportedVaultError()
    return parts
}

// On a well-formed slot only a wrong password fails the GCM tag.
export async function checked<T>(attempt: Promise<T>): Promise<T> {
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
        const slots = await masterSlots(secret, password, newRecovery)
        const key = await vaultKey(await importRoot(secret))
        return {
            slots,
            key: { ...key, recovery: await importRecovery(slots.recovery) },
        }
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
            await slotKey(await masterRoot(password, slot.kdf)),
            gcm(iv, SLOT),
            'HKDF',
            false,
            ['deriveKey'],
        ),
    )
    return vaultKey(root)
}

/** The one place the secrets are in script memory after creation, and only behind the old password.
 *  The recovery pair carries over, so accounts' recovery slots stay valid; a vault without one gets it. */
export async function rewrapSlots(
    slots: VaultSlots,
    oldPassword: string,
    newPassword: string,
): Promise<MasterSlots & { changedAt: number }> {
    const { iv, cipher } = slotParts(slots.password)
    const oldRoot = await masterRoot(oldPassword, slots.password.kdf)
    const secret = new Uint8Array(
        await checked(
            crypto.subtle.decrypt(
                gcm(iv, SLOT),
                await slotKey(oldRoot),
                cipher,
            ),
        ),
    )
    try {
        const next = await masterSlots(secret, newPassword, async (root) => {
            if (!slots.recovery) return newRecovery(root)
            const sealed = splitSealed(slots.recovery.privateKey)
            const pkcs8 = new Uint8Array(
                await crypto.subtle.decrypt(
                    gcm(sealed.iv, RECOVERY),
                    await recoveryKey(oldRoot),
                    sealed.cipher,
                ),
            )
            return sealRecovery(
                root,
                Uint8Array.fromBase64(slots.recovery.publicKey),
                pkcs8,
            )
        })
        return { ...next, changedAt: Date.now() }
    } finally {
        secret.fill(0)
    }
}

/** The slots with a recovery slot for a vault made before it existed; the master password was just typed to unlock. */
export async function addRecovery(
    slots: VaultSlots,
    password: string,
): Promise<VaultSlots & { recovery: RecoverySlot }> {
    const recovery = await newRecovery(
        await masterRoot(password, slots.password.kdf),
    )
    return { ...slots, recovery, changedAt: Date.now() }
}
