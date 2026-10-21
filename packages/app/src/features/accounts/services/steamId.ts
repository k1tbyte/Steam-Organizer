export type SteamIdFormat =
    | 'account-id'
    | 'steamid64'
    | 'steam2'
    | 'steam3'
    | 'profile-url'
    | 'friend-code'
    | 'steam3-hex'
    | 'vanity'

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
