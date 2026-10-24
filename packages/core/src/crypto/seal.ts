const IV_BYTES = 12
const text = new TextEncoder()

/** base64 of the IV followed by the AES-GCM ciphertext and tag. */
export type Sealed = string

export function splitSealed(sealed: Sealed) {
    const bytes = Uint8Array.fromBase64(sealed)
    return { iv: bytes.subarray(0, IV_BYTES), cipher: bytes.subarray(IV_BYTES) }
}

/** `aad` binds the blob to its place (a record and part, a slot), so it cannot be moved to another. */
export function gcm(iv: Uint8Array<ArrayBuffer>, aad: string): AesGcmParams {
    return { name: 'AES-GCM', iv, additionalData: text.encode(aad) }
}

export async function sealBytes(
    key: CryptoKey,
    plain: Uint8Array<ArrayBuffer>,
    aad: string,
): Promise<Sealed> {
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))
    const cipher = await crypto.subtle.encrypt(gcm(iv, aad), key, plain)
    const out = new Uint8Array(IV_BYTES + cipher.byteLength)
    out.set(iv)
    out.set(new Uint8Array(cipher), IV_BYTES)
    return out.toBase64()
}

export async function openBytes(
    key: CryptoKey,
    sealed: Sealed,
    aad: string,
): Promise<Uint8Array<ArrayBuffer>> {
    const { iv, cipher } = splitSealed(sealed)
    return new Uint8Array(
        await crypto.subtle.decrypt(gcm(iv, aad), key, cipher),
    )
}

export const sealText = (key: CryptoKey, value: string, aad: string) =>
    sealBytes(key, text.encode(value), aad)

export const openText = async (key: CryptoKey, sealed: Sealed, aad: string) =>
    new TextDecoder().decode(await openBytes(key, sealed, aad))
