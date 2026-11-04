import {
    prfWrap,
    resealSecretSlot,
    type SecretSlot,
    sealRearm,
    slotOf,
    type VaultKey,
} from '@so/core'

import { reportError } from '#core/reportError'
import { passkeyRpId } from '#core/session/passkeys'
import { readPlaced, saveSlot, withSlotsLock } from './deviceSlots'

/** A ceremony never throws a `DOMException` into the UI: a cancel, a missing PRF and a failure are results. `no-prf`: a
 *  passkey came back without the PRF output, as a password manager's does (Bitwarden). */
export type PasskeyFailure = 'cancelled' | 'unsupported' | 'no-prf' | 'failed'

export interface PasskeyEnrollment {
    credentialId: string
    /** The 32 bytes the passkey's PRF returned; the caller zeroes them once used. */
    bits: Uint8Array<ArrayBuffer>
}

const TIMEOUT_MS = 60_000
const text = new TextEncoder()

/** The PRF input: one fixed salt per vault, so the same passkey gives the same bits for it every time. */
const saltOf = async (vaultId: string) =>
    new Uint8Array(
        await crypto.subtle.digest(
            'SHA-256',
            text.encode(`so:hello:${vaultId}`),
        ),
    )

const fresh = (bytes: number) => crypto.getRandomValues(new Uint8Array(bytes))

function failure(error: unknown): PasskeyFailure {
    const name = (error as { name?: unknown } | null)?.name
    // The user closed the prompt, it timed out, or the platform refused the user verification.
    if (name === 'NotAllowedError' || name === 'AbortError') return 'cancelled'
    reportError(error, 'passkey')
    return 'failed'
}

/** Whether a platform authenticator with PRF can be used: `getClientCapabilities` says so where it reports PRF, else a
 *  passkey or user-verifying platform authenticator is taken to have it (enrolling checks). False without the shell's RP ID. */
export async function passkeysAvailable(): Promise<boolean> {
    if (passkeyRpId() === undefined) return false
    if (
        typeof PublicKeyCredential === 'undefined' ||
        !globalThis.navigator?.credentials
    )
        return false
    try {
        const capabilities = await PublicKeyCredential.getClientCapabilities?.()
        if (capabilities && 'extension:prf' in capabilities)
            return capabilities['extension:prf'] === true
        // Safari reports no extensions, and no user-verifying authenticator even with Touch ID: its passkeys are iCloud Keychain's.
        if (capabilities?.passkeyPlatformAuthenticator) return true
        return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    } catch {
        return false
    }
}

function prfOf(credential: Credential | null) {
    const results = (
        credential as PublicKeyCredential | null
    )?.getClientExtensionResults() as
        | { prf?: { enabled?: boolean; results?: { first?: BufferSource } } }
        | undefined
    return results?.prf
}

/** Copies the browser's PRF buffer and zeroes the original. */
function takeBits(bits: BufferSource): Uint8Array<ArrayBuffer> {
    const view =
        bits instanceof ArrayBuffer
            ? new Uint8Array(bits)
            : new Uint8Array(bits.buffer, bits.byteOffset, bits.byteLength)
    const copy = view.slice()
    view.fill(0)
    return copy
}

/** Registers a platform passkey for the vault and reads its PRF output: from the creation when the authenticator
 *  gives it, else from one assertion. The RP ID is the shell's, the same one every assertion uses. */
export async function enroll(
    vaultId: string,
): Promise<PasskeyEnrollment | PasskeyFailure> {
    const rpId = passkeyRpId()
    if (rpId === undefined || !globalThis.navigator?.credentials)
        return 'unsupported'
    try {
        const salt = await saltOf(vaultId)
        const created = await navigator.credentials.create({
            publicKey: {
                rp: { id: rpId, name: 'Steam Organizer' },
                user: {
                    id: text.encode(vaultId),
                    name: 'Steam Organizer',
                    displayName: 'Steam Organizer',
                },
                challenge: fresh(32),
                pubKeyCredParams: [
                    { type: 'public-key', alg: -7 },
                    { type: 'public-key', alg: -257 },
                ],
                authenticatorSelection: {
                    authenticatorAttachment: 'platform',
                    userVerification: 'required',
                    residentKey: 'preferred',
                },
                timeout: TIMEOUT_MS,
                extensions: { prf: { eval: { first: salt } } },
            },
        })
        const credential = created as PublicKeyCredential | null
        const prf = prfOf(credential)
        if (!credential) return 'unsupported'
        if (!prf?.enabled) return 'no-prf'
        const credentialId = new Uint8Array(credential.rawId).toBase64({
            alphabet: 'base64url',
        })
        if (prf.results?.first)
            return { credentialId, bits: takeBits(prf.results.first) }
        const bits = await prfBits(credentialId, vaultId)
        return typeof bits === 'string' ? bits : { credentialId, bits }
    } catch (error) {
        return failure(error)
    }
}

/** One assertion with the enrolled passkey: its PRF output for the vault's salt. */
export async function prfBits(
    credentialId: string,
    vaultId: string,
): Promise<Uint8Array<ArrayBuffer> | PasskeyFailure> {
    const rpId = passkeyRpId()
    if (rpId === undefined || !globalThis.navigator?.credentials)
        return 'unsupported'
    try {
        const asserted = await navigator.credentials.get({
            publicKey: {
                rpId,
                challenge: fresh(32),
                allowCredentials: [
                    {
                        type: 'public-key',
                        id: Uint8Array.fromBase64(credentialId, {
                            alphabet: 'base64url',
                        }),
                    },
                ],
                userVerification: 'required',
                timeout: TIMEOUT_MS,
                extensions: { prf: { eval: { first: await saltOf(vaultId) } } },
            },
        })
        const first = prfOf(asserted)?.results?.first
        return first ? takeBits(first) : 'no-prf'
    } catch (error) {
        return failure(error)
    }
}

/** Moves the secret from the password slot under a new passkey's PRF key, and seals the PRF output under `records`
 *  for Master password after restart. The caller zeroes `bits`. */
export function enrollPrf(
    vaultId: string,
    records: VaultKey,
    from: SecretSlot,
    credentialId: string,
    bits: Uint8Array<ArrayBuffer>,
) {
    return withSlotsLock(vaultId, async () => {
        const key = await resealSecretSlot(from, await prfWrap(bits))
        const sealed = await sealRearm(records, 'prf', bits)
        await saveSlot(
            vaultId,
            'prf',
            { credentialId, bits: sealed },
            { credentialId, key },
        )
    })
}

/** The vault's passkey slot once the user verifies on the platform prompt; `wrong` when there is none, the ceremony
 *  failed or was cancelled. The PRF bits are zeroed as soon as they have made the key. */
export async function passkeySlot(
    vaultId: string,
): Promise<SecretSlot | 'wrong'> {
    const slot = (await readPlaced(vaultId)).prf
    if (!slot) return 'wrong'
    const bits = await prfBits(slot.credentialId, vaultId)
    if (typeof bits === 'string') return 'wrong'
    try {
        return slotOf(await prfWrap(bits), slot.key)
    } finally {
        bits.fill(0)
    }
}
