import { UnsupportedVaultError } from '../errors'
import {
    checked,
    derive,
    importRoot,
    type Kdf,
    masterRoot,
    newKdf,
    type VaultKey,
    vaultKey,
} from './kdf'
import { gcm, type Sealed, sealBytes, splitSealed } from './seal'
import {
    openSecretSlot,
    PASSWORD_SLOT,
    passwordSecretSlot,
    secretParts,
} from './secretSlots'

export type { VaultKey } from './kdf'

const SECRET_BYTES = 32
const TAG_BYTES = 16
const SLOT = PASSWORD_SLOT
const RECOVERY = 'slot:recovery'
const RSA: RsaHashedImportParams = { name: 'RSA-OAEP', hash: 'SHA-256' }
const text = new TextEncoder()

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

/** The Steam ID's tag, for an everything lock that hides the ID: a login holds no colon, so the two never collide. */
export const steamTag = (key: VaultKey, steamId: string) =>
    loginTag(key, `steam:${steamId}`)

const slotKey = (root: CryptoKey) => derive(root, SLOT, ['encrypt', 'decrypt'])
const recoveryKey = (root: CryptoKey) =>
    derive(root, RECOVERY, ['encrypt', 'decrypt', 'unwrapKey'])

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

export const slotParts = (slot: PasswordSlot) => secretParts(slot.key)

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
    return openSecretSlot(await passwordSecretSlot(slot, password))
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
