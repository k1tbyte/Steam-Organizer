// The one module that touches web storage; calls survive denied storage.
export const MOCKS_STORAGE_KEY = 'so:mocks'

// Appearance prefs (core/appearance): one key each, plus the background image's own four.
export const MODE_STORAGE_KEY = 'so:mode'
export const ACCENT_STORAGE_KEY = 'so:accent'
export const TINT_STORAGE_KEY = 'so:tint'
export const SURFACE_STORAGE_KEY = 'so:surface'
export const BACKGROUND_STORAGE_KEY = 'so:bg'
export const RADIUS_STORAGE_KEY = 'so:radius'
export const DENSITY_STORAGE_KEY = 'so:density'
export const MOTION_STORAGE_KEY = 'so:motion'
export const LANGUAGE_STORAGE_KEY = 'so:lang'
export const BG_SRC_STORAGE_KEY = 'so:bg-src'
export const BG_NAME_STORAGE_KEY = 'so:bg-name'
export const BG_BLUR_STORAGE_KEY = 'so:bg-blur'
export const BG_DIM_STORAGE_KEY = 'so:bg-dim'

// Accounts list (features/accounts): card fields, and the filter and sort view per vault (`:<vault id>`).
export const ACCOUNTS_CARD_FIELDS_STORAGE_KEY = 'so:accounts:fields'
export const ACCOUNTS_VIEW_STORAGE_KEY = 'so:accounts:view'

// Account profile (features/profile): the Steam ID format and the collapsed sections, shared by every profile.
export const PROFILE_ID_FORMAT_STORAGE_KEY = 'so:profile:id-format'
export const PROFILE_SECTIONS_STORAGE_KEY = 'so:profile:sections'

// Vaults (features/vault): the one opened last, which the unlock screen offers first.
export const LAST_VAULT_STORAGE_KEY = 'so:vault:last'

// Google Drive (features/drive): the account this device backs up to; the token is never stored here.
export const DRIVE_ACCOUNT_STORAGE_KEY = 'so:drive:account'

// Drive sync (features/backups): Auto sync, its interval and Auto backup, per device.
export const SYNC_SETTINGS_STORAGE_KEY = 'so:sync'

// Security (features/vault): Lock after and Master password after restart, per device.
export const SECURITY_SETTINGS_STORAGE_KEY = 'so:security'

// Notifications (features/notifications): each vault's log by vault id, ids and numbers only.
export const NOTIFICATIONS_STORAGE_KEY = 'so:notifications'

/** The tab's `sessionStorage`; undefined where there is none (node) or storage is denied. */
export function tabStorage(): Storage | undefined {
    try {
        return typeof sessionStorage === 'undefined'
            ? undefined
            : sessionStorage
    } catch {
        return undefined
    }
}

export function readStored(key: string): string | null {
    try {
        return localStorage.getItem(key)
    } catch {
        return null
    }
}

export function writeStored(key: string, value: string): void {
    try {
        localStorage.setItem(key, value)
    } catch {}
}

export function removeStored(key: string): void {
    try {
        localStorage.removeItem(key)
    } catch {}
}

export function parseRecord(
    raw: string | null | undefined,
): Record<string, unknown> {
    try {
        const value: unknown = JSON.parse(raw ?? '')
        return typeof value === 'object' &&
            value !== null &&
            !Array.isArray(value)
            ? (value as Record<string, unknown>)
            : {}
    } catch {
        return {}
    }
}

export function oneOf<T extends string>(
    allowed: readonly T[],
    value: unknown,
    fallback: T,
): T {
    return allowed.includes(value as T) ? (value as T) : fallback
}

export function flag(value: unknown, fallback: boolean): boolean {
    return typeof value === 'boolean' ? value : fallback
}
