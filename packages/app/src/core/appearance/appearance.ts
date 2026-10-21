import { DEFAULT_ACCENT } from '@so/ui/accents'

import {
    ACCENT_STORAGE_KEY,
    BACKGROUND_STORAGE_KEY,
    DENSITY_STORAGE_KEY,
    LANGUAGE_STORAGE_KEY,
    MODE_STORAGE_KEY,
    MOTION_STORAGE_KEY,
    RADIUS_STORAGE_KEY,
    readStored,
    SURFACE_STORAGE_KEY,
    TINT_STORAGE_KEY,
} from '../storage'

interface PrefSpec {
    storageKey: string
    /** A `--*` custom property on <html> or a plain attribute. */
    target: string
    values?: readonly string[]
    /** Numeric range, stored as text. */
    range?: readonly [number, number]
    /** Appended to the written custom property (`16` -> `16px`). */
    unit?: string
    fallback: string
    /** Written even at the fallback, for targets with no absent state. */
    always?: boolean
    /** The value written for one that defers to the device (`system`, `auto`). */
    resolve?: (value: string) => string
    /** Media queries the resolved value follows live. */
    follows?: readonly string[]
}

const LIGHT_QUERY = '(prefers-color-scheme: light)'
// Where motion costs more than it gives: an OS reduce request or a touch device.
const CALM_QUERIES = ['(prefers-reduced-motion: reduce)', '(pointer: coarse)']

const matches = (query: string) =>
    typeof matchMedia !== 'undefined' && matchMedia(query).matches

/** `system` follows the OS; every other value is already a mode. */
export function resolveMode(value: string): string {
    if (value !== 'system') return value
    return matches(LIGHT_QUERY) ? 'light' : 'dark'
}

/** `auto` is Simple on a touch device or under an OS reduce request, Gamify elsewhere. */
export function resolveMotion(value: string): string {
    if (value !== 'auto') return value
    return CALM_QUERIES.some(matches) ? 'simple' : 'gamify'
}

/** Single source for appearance state: storage key, <html> target, allowed values, default. */
export const APPEARANCE_PREFS = {
    mode: {
        storageKey: MODE_STORAGE_KEY,
        target: 'data-mode',
        values: ['dark', 'light', 'system'],
        fallback: 'dark',
        always: true,
        resolve: resolveMode,
        follows: [LIGHT_QUERY],
    },
    accent: {
        storageKey: ACCENT_STORAGE_KEY,
        target: '--accent',
        fallback: DEFAULT_ACCENT,
    },
    tint: {
        storageKey: TINT_STORAGE_KEY,
        target: 'data-tint',
        values: ['on', 'off'],
        fallback: 'on',
    },
    surface: {
        storageKey: SURFACE_STORAGE_KEY,
        target: 'data-surface',
        values: ['flat', 'subtle', 'glass'],
        fallback: 'flat',
    },
    background: {
        storageKey: BACKGROUND_STORAGE_KEY,
        target: 'data-bg',
        values: ['plain', 'clean', 'noisy', 'grid', 'image'],
        fallback: 'plain',
    },
    radius: {
        storageKey: RADIUS_STORAGE_KEY,
        target: '--radius-base',
        range: [0, 24],
        unit: 'px',
        fallback: '16',
    },
    density: {
        storageKey: DENSITY_STORAGE_KEY,
        target: 'data-density',
        values: ['compact', 'comfortable', 'spacious'],
        fallback: 'comfortable',
    },
    motion: {
        storageKey: MOTION_STORAGE_KEY,
        target: 'data-motion',
        values: ['off', 'simple', 'gamify', 'auto'],
        fallback: 'auto',
        always: true,
        resolve: resolveMotion,
        follows: CALM_QUERIES,
    },
    language: {
        storageKey: LANGUAGE_STORAGE_KEY,
        target: 'lang',
        values: ['en', 'ru'],
        fallback: 'en',
        always: true,
    },
} as const satisfies Record<string, PrefSpec>

export type PrefName = keyof typeof APPEARANCE_PREFS

// Endonyms: each language names itself, never translated.
export const LANGUAGE_NAMES = { en: 'English', ru: 'Русский' } as const

// Literal unions where the table lists them, so a setter rejects a typo.
export type PrefValue<K extends PrefName> =
    ((typeof APPEARANCE_PREFS)[K] extends { values: readonly (infer V)[] }
        ? V
        : string) &
        string

export const PREF_NAMES = Object.keys(APPEARANCE_PREFS) as PrefName[]

/** What the part of <html> an applied pref needs: the live document or a test double. */
export interface AppearanceRoot {
    style: Pick<CSSStyleDeclaration, 'setProperty' | 'removeProperty'>
    setAttribute(name: string, value: string): void
    removeAttribute(name: string): void
}

export function prefSpec(name: PrefName): PrefSpec {
    return APPEARANCE_PREFS[name]
}

/** Coerces a stored value to one the pref accepts, else the default. */
export function parsePref<K extends PrefName>(
    name: K,
    raw: unknown,
): PrefValue<K> {
    const { values, range, fallback } = prefSpec(name)
    const text = raw === null || raw === undefined ? '' : String(raw)
    if (values) return (values.includes(text) ? text : fallback) as PrefValue<K>
    if (range) {
        const n = Number(text)
        const valid = text !== '' && Number.isFinite(n)
        return (
            valid ? String(Math.min(range[1], Math.max(range[0], n))) : fallback
        ) as PrefValue<K>
    }
    return (text === '' ? fallback : text) as PrefValue<K>
}

export function isPrefDefault(name: PrefName, value: string): boolean {
    const { fallback, always } = prefSpec(name)
    return value === fallback && always !== true
}

/** Writes one pref onto <html>; a default value removes its target so CSS falls back. */
export function applyPref(root: AppearanceRoot, name: PrefName, value: string) {
    const { target, unit, resolve } = prefSpec(name)
    const written = resolve ? resolve(value) : value
    const bare = isPrefDefault(name, value)
    if (target.startsWith('--')) {
        if (bare) root.style.removeProperty(target)
        else root.style.setProperty(target, written + (unit ?? ''))
        return
    }
    if (bare) root.removeAttribute(target)
    else root.setAttribute(target, written)
}

export function readPref<K extends PrefName>(name: K): PrefValue<K> {
    return parsePref(name, readStored(prefSpec(name).storageKey))
}
