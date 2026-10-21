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

/** Which 30s window `nowMs` falls in, and the whole seconds left in it. */
export function guardPhase(nowMs: number) {
    const seconds = nowMs / 1000
    return {
        period: Math.floor(seconds / GUARD_PERIOD_S),
        remaining: GUARD_PERIOD_S - Math.floor(seconds % GUARD_PERIOD_S),
    }
}
