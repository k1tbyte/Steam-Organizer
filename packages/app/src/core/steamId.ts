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

/** The account ID in what the user typed; null for a vanity name or a friend code, which need Steam. */
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
        case 'profile-url': {
            const id = /\/profiles\/(\d{17})/i.exec(value)?.[1]
            return id ? toAccountId(id) : null
        }
        default:
            return null
    }
}

export interface SteamIdLookups {
    /** Both come from Steam, not from the account ID: the friend code is a hash, a vanity URL is chosen. */
    friendCode: string | null
    vanity: string | null
}

/** One account ID in all seven display formats; null where Steam has nothing to show (no vanity URL). */
export function steamIdValues(
    accountId: string,
    { friendCode, vanity }: SteamIdLookups,
): Record<SteamIdDisplayFormat, string | null> {
    const id = BigInt(accountId)
    return {
        'account-id': accountId,
        steamid64: toSteamId64(accountId),
        steam2: `STEAM_1:${id % 2n}:${id / 2n}`,
        steam3: `[U:1:${accountId}]`,
        'friend-code': friendCode,
        'steam3-hex': (INDIVIDUAL_BASE + id).toString(16),
        vanity,
    }
}
