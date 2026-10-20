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
export const REDUCE_MOTION_STORAGE_KEY = 'so:reduce-motion'
export const LANGUAGE_STORAGE_KEY = 'so:lang'
export const BG_SRC_STORAGE_KEY = 'so:bg-src'
export const BG_NAME_STORAGE_KEY = 'so:bg-name'
export const BG_BLUR_STORAGE_KEY = 'so:bg-blur'
export const BG_DIM_STORAGE_KEY = 'so:bg-dim'

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
