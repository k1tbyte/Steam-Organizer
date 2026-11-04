import { type PrefName, type PrefValue, parsePref } from './appearance'
import { BLUR_DEFAULT, BLUR_MAX, DIM_DEFAULT, DIM_MAX } from './background'

/** The settings a preset holds; motion and language stay with the device. */
export const LOOK_PREFS = [
    'mode',
    'accent',
    'tint',
    'surface',
    'background',
    'radius',
    'density',
] as const satisfies readonly PrefName[]

export type LookPref = (typeof LOOK_PREFS)[number]

/** Values as text, as a device stores them and a preset record carries them. */
export type Look = { [K in LookPref]: PrefValue<K> } & {
    blur: string
    dim: string
}

function amount(raw: unknown, max: number, fallback: number): string {
    const n = typeof raw === 'string' && raw !== '' ? Number(raw) : Number.NaN
    return String(Number.isFinite(n) ? Math.min(max, Math.max(0, n)) : fallback)
}

/** A stored look (a preset's), each setting coerced: a missing or odd one reads as its default. */
export function parseLook(stored: unknown): Look {
    const raw = (typeof stored === 'object' ? (stored ?? {}) : {}) as Readonly<
        Record<string, unknown>
    >
    const prefs = Object.fromEntries(
        LOOK_PREFS.map((name) => [name, parsePref(name, raw[name])]),
    ) as { [K in LookPref]: PrefValue<K> }
    return {
        ...prefs,
        blur: amount(raw.blur, BLUR_MAX, BLUR_DEFAULT),
        dim: amount(raw.dim, DIM_MAX, DIM_DEFAULT),
    }
}

/** Blur and dim count only on an Image background. */
export function sameLook(a: Look, b: Look): boolean {
    if (LOOK_PREFS.some((name) => a[name] !== b[name])) return false
    return a.background !== 'image' || (a.blur === b.blur && a.dim === b.dim)
}
