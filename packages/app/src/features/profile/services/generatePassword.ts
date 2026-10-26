// No 0/O, 1/l/I: the password gets read off a screen and typed elsewhere.
const ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Three dash-joined groups of four ("q7Vd-ru2K-mPzx"). */
export function generatePassword(): string {
    const chars = [...crypto.getRandomValues(new Uint32Array(12))].map(
        (n) => ALPHABET[n % ALPHABET.length],
    )
    return [0, 4, 8].map((at) => chars.slice(at, at + 4).join('')).join('-')
}
