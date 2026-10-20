// The one module that touches web storage; calls survive denied storage.
export const MOCKS_STORAGE_KEY = 'so:mocks'

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
