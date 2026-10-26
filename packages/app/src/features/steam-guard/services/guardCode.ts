export const GUARD_PERIOD_S = 30
export const MASKED_CODE = '•••••'

// Steam's own alphabet: no vowels or look-alikes.
const ALPHABET = '23456789BCDFGHJKMNPQRTVWXY'
const CODE_LENGTH = 5

/** A deterministic stand-in for the TOTP: real codes need the authenticator's shared secret. */
export function demoGuardCode(seed: string, period: number): string {
    let hash = 2166136261
    for (const char of `${seed}:${period}`) {
        hash ^= char.charCodeAt(0)
        hash = Math.imul(hash, 16777619)
    }
    let code = ''
    for (let i = 0; i < CODE_LENGTH; i++) {
        code += ALPHABET[(hash >>> 0) % ALPHABET.length]
        hash = Math.imul(hash ^ (hash >>> 13), 2654435761)
    }
    return code
}

/** Steam's TOTP: HMAC-SHA1 of the period under the maFile's base64 `shared_secret`. */
export async function steamGuardCode(
    sharedSecret: string,
    period: number,
): Promise<string> {
    const key = await crypto.subtle.importKey(
        'raw',
        Uint8Array.from(atob(sharedSecret), (char) => char.charCodeAt(0)),
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign'],
    )
    const counter = new DataView(new ArrayBuffer(8))
    counter.setBigUint64(0, BigInt(period))
    const mac = new DataView(
        await crypto.subtle.sign('HMAC', key, counter.buffer),
    )
    let full = mac.getUint32(mac.getUint8(19) & 0x0f) & 0x7fffffff
    let code = ''
    for (let i = 0; i < CODE_LENGTH; i++) {
        code += ALPHABET[full % ALPHABET.length]
        full = Math.floor(full / ALPHABET.length)
    }
    return code
}

/** Which 30s window `nowMs` falls in, and the whole seconds left in it. */
export function guardPhase(nowMs: number) {
    const seconds = nowMs / 1000
    return {
        period: Math.floor(seconds / GUARD_PERIOD_S),
        remaining: GUARD_PERIOD_S - Math.floor(seconds % GUARD_PERIOD_S),
    }
}
