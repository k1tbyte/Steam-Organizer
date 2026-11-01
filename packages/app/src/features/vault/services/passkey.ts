import { prfWrap, type SecretSlot, slotOf } from '@so/core'

import { passkeyRpId } from '../../../core/session/passkeys'
import { readPlaced } from './deviceSlots'

export type PasskeyFailure = 'cancelled' | 'unsupported' | 'failed'

/** A ceremony never throws a `DOMException` into the UI: a cancel, a missing PRF and a failure are results. */
export type PasskeyResult<T> =
    | { ok: true; value: T }
    | { ok: false; reason: PasskeyFailure }

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

function failure(error: unknown): { ok: false; reason: PasskeyFailure } {
    const name = (error as { name?: unknown } | null)?.name
    // The user closed the prompt, it timed out, or the platform refused the user verification.
    return {
        ok: false,
        reason:
            name === 'NotAllowedError' || name === 'AbortError'
                ? 'cancelled'
                : 'failed',
    }
}

/** Whether a platform authenticator with the PRF extension can be used here: the browser says so
 *  (`getClientCapabilities`) where it can, else a user-verifying platform authenticator is taken to have it.
 *  False without an RP ID from the shell. */
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

const copyOf = (bits: BufferSource) =>
    new Uint8Array(
        bits instanceof ArrayBuffer
            ? bits.slice(0)
            : new Uint8Array(
                  bits.buffer,
                  bits.byteOffset,
                  bits.byteLength,
              ).slice().buffer,
    )

/** Registers a platform passkey for the vault and reads its PRF output: from the creation when the authenticator
 *  gives it, else from one assertion. The RP ID is the shell's, the same one every assertion uses. */
export async function enroll(
    vaultId: string,
): Promise<PasskeyResult<PasskeyEnrollment>> {
    const rpId = passkeyRpId()
    if (rpId === undefined || !globalThis.navigator?.credentials)
        return { ok: false, reason: 'unsupported' }
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
        if (!credential || !prf?.enabled)
            return { ok: false, reason: 'unsupported' }
        const credentialId = new Uint8Array(credential.rawId).toBase64({
            alphabet: 'base64url',
        })
        if (prf.results?.first)
            return {
                ok: true,
                value: { credentialId, bits: copyOf(prf.results.first) },
            }
        const asked = await prfBits(credentialId, vaultId)
        return asked.ok
            ? { ok: true, value: { credentialId, bits: asked.value } }
            : asked
    } catch (error) {
        return failure(error)
    }
}

/** One assertion with the enrolled passkey: its PRF output for the vault's salt. */
export async function prfBits(
    credentialId: string,
    vaultId: string,
): Promise<PasskeyResult<Uint8Array<ArrayBuffer>>> {
    const rpId = passkeyRpId()
    if (rpId === undefined || !globalThis.navigator?.credentials)
        return { ok: false, reason: 'unsupported' }
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
        return first
            ? { ok: true, value: copyOf(first) }
            : { ok: false, reason: 'unsupported' }
    } catch (error) {
        return failure(error)
    }
}

export type HelloKind = 'windows' | 'touchid' | 'fingerprint' | 'passkey'

/** What the OS calls its platform authenticator, from the platform and user agent strings. */
export function helloKindOf(platform: string, userAgent: string): HelloKind {
    const both = `${platform} ${userAgent}`
    if (/android/i.test(both)) return 'fingerprint'
    if (/iphone|ipad|ipod|mac/i.test(both)) return 'touchid'
    if (/win/i.test(both)) return 'windows'
    return 'passkey'
}

export function helloKind(): HelloKind {
    const nav = globalThis.navigator as
        | (Navigator & { userAgentData?: { platform?: string } })
        | undefined
    return helloKindOf(
        nav?.userAgentData?.platform ?? nav?.platform ?? '',
        nav?.userAgent ?? '',
    )
}

/** The vault's passkey slot once the user verifies on the platform prompt; `wrong` when there is none, the ceremony
 *  failed or was cancelled. The PRF bits are zeroed as soon as they have made the key. */
export async function passkeySlot(
    vaultId: string,
): Promise<SecretSlot | 'wrong'> {
    const slot = (await readPlaced(vaultId)).prf
    if (!slot) return 'wrong'
    const asked = await prfBits(slot.credentialId, vaultId)
    if (!asked.ok) return 'wrong'
    try {
        return slotOf(await prfWrap(asked.value), slot.key)
    } finally {
        asked.value.fill(0)
    }
}
