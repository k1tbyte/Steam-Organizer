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

// Accounts list (features/accounts): card fields and the search, filter and sort view.
export const ACCOUNTS_CARD_FIELDS_STORAGE_KEY = 'so:accounts:fields'
export const ACCOUNTS_VIEW_STORAGE_KEY = 'so:accounts:view'

// Account profile (features/profile): the Steam ID format and the collapsed sections, shared by every profile.
export const PROFILE_ID_FORMAT_STORAGE_KEY = 'so:profile:id-format'
export const PROFILE_SECTIONS_STORAGE_KEY = 'so:profile:sections'

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
