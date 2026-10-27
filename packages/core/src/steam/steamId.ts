import { md5 } from '@noble/hashes/legacy.js'

export const STEAM_ID_DISPLAY_FORMATS = [
    'account-id',
    'steamid64',
    'steam2',
    'steam3',
    'friend-code',
    'steam3-hex',
    'vanity',
] as const
export type SteamIdDisplayFormat = (typeof STEAM_ID_DISPLAY_FORMATS)[number]

/** What the user can type: every display format, plus a profile URL. */
export type SteamIdFormat = SteamIdDisplayFormat | 'profile-url'

// Ordered: a profile URL or a typed ID must win before a bare vanity name can swallow it.
const FORMATS: [SteamIdFormat, RegExp][] = [
    [
        'profile-url',
        /^(?:https?:\/\/)?(?:www\.)?steamcommunity\.com\/(?:profiles\/\d{17}|id\/[\w-]+)\/?(?:[?#]\S*)?$/i,
    ],
    ['steamid64', /^7656119\d{10}$/],
    ['steam2', /^STEAM_[0-5]:[01]:\d+$/i],
    ['steam3', /^\[U:1:\d+\]$/i],
    ['account-id', /^\d{1,10}$/],
    ['friend-code', /^[A-Z0-9]{4,5}-[A-Z0-9]{4}$/i],
    ['steam3-hex', /^(?:0x)?1100001[0-9a-f]{8}$/i],
    ['vanity', /^[a-zA-Z0-9_-]{2,32}$/],
]

/** The Steam identifier format of what the user typed; null while empty, 'unknown' when none fits. */
export function detectSteamId(raw: string): SteamIdFormat | 'unknown' | null {
    const value = raw.trim()
    if (value === '') return null
    return FORMATS.find(([, pattern]) => pattern.test(value))?.[0] ?? 'unknown'
}

/** Public individual accounts: the SteamID64 is this base plus the account ID. */
const INDIVIDUAL_BASE = 76561197960265728n

/** The account's SteamID64, the key of every Steam and SteamDB URL. */
export function toSteamId64(accountId: string): string {
    return (INDIVIDUAL_BASE + BigInt(accountId)).toString()
}

export function toAccountId(steamId64: string): string {
    return (BigInt(steamId64) - INDIVIDUAL_BASE).toString()
}

// CS2 friend codes: the account ID's nibbles, each with one bit of an MD5 over it, in this base 32.
const FRIEND_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CSGO_TAG = 0x4353474fn << 32n

const swapBytes = (value: bigint) => {
    const bytes = new DataView(new ArrayBuffer(8))
    bytes.setBigUint64(0, value, true)
    return bytes.getBigUint64(0)
}

function friendCodeOf(accountId: bigint): string {
    const tagged = new DataView(new ArrayBuffer(8))
    tagged.setBigUint64(0, accountId | CSGO_TAG, true)
    const hash = new DataView(
        md5(new Uint8Array(tagged.buffer)).buffer,
    ).getUint32(0, true)
    let packed = 0n
    for (let i = 0; i < 8; i++) {
        const nibble = (accountId >> BigInt(4 * i)) & 0xfn
        packed = (packed << 5n) | (nibble << 1n) | BigInt((hash >>> i) & 1)
    }
    let code = ''
    let rest = swapBytes(packed)
    for (let i = 0; i < 13; i++, rest >>= 5n) {
        if (i === 4 || i === 9) code += '-'
        code += FRIEND_ALPHABET[Number(rest & 31n)]
    }
    // The first four letters are always A.
    return code.slice(5)
}

/** null when the code's check bits do not match: a typo, not another account. */
function readFriendCode(raw: string): string | null {
    const code = raw.toUpperCase()
    let swapped = 0n
    for (const [i, char] of [...`AAAA${code.replace('-', '')}`].entries()) {
        const digit = FRIEND_ALPHABET.indexOf(char)
        if (digit < 0) return null
        swapped |= BigInt(digit) << BigInt(5 * i)
    }
    const packed = swapBytes(swapped)
    let accountId = 0n
    for (let i = 0; i < 8; i++)
        accountId |=
            ((packed >> BigInt(5 * (7 - i) + 1)) & 0xfn) << BigInt(4 * i)
    return friendCodeOf(accountId) === code ? accountId.toString() : null
}

/** The account ID in what the user typed; null for a vanity name or a custom URL, which need Steam. */
export function parseAccountId(raw: string): string | null {
    const value = raw.trim()
    switch (detectSteamId(value)) {
        case 'account-id':
            return value
        case 'steamid64':
            return toAccountId(value)
        case 'steam2': {
            const [, low = '', high = ''] = value.split(':')
            return (BigInt(high) * 2n + BigInt(low)).toString()
        }
        case 'steam3':
            return value.slice(5, -1)
        case 'steam3-hex':
            return BigInt(`0x${value.slice(-8)}`).toString()
        case 'friend-code':
            return readFriendCode(value)
        case 'profile-url': {
            const id = /\/profiles\/(\d{17})/i.exec(value)?.[1]
            return id ? toAccountId(id) : null
        }
        default:
            return null
    }
}

/** The vanity name in a bare name or a `/id/` URL, the user's or Steam's `profileurl`. */
export function vanityIn(raw: string): string | null {
    const value = raw.trim()
    const format = detectSteamId(value)
    // `john-wick` has a friend code's shape: one whose check bits fail may still be a vanity name.
    if (format === 'vanity' || format === 'friend-code') return value
    return /steamcommunity\.com\/id\/([\w-]+)/i.exec(value)?.[1] ?? null
}

/** One account ID in all seven display formats; the vanity name is null when the profile has none. */
export function steamIdValues(
    accountId: string,
    vanity: string | null,
): Record<SteamIdDisplayFormat, string | null> {
    const id = BigInt(accountId)
    return {
        'account-id': accountId,
        steamid64: toSteamId64(accountId),
        steam2: `STEAM_1:${id % 2n}:${id / 2n}`,
        steam3: `[U:1:${accountId}]`,
        'friend-code': friendCodeOf(id),
        'steam3-hex': (INDIVIDUAL_BASE + id).toString(16),
        vanity,
    }
}
