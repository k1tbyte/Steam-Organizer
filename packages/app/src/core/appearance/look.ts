import { type RevealOrigin, revealThemeChange } from '@so/ui/theme-reveal'
import { computed } from 'vue'

import { type PrefName, type PrefValue, parsePref } from './appearance'
import { BLUR_DEFAULT, BLUR_MAX, DIM_DEFAULT, DIM_MAX } from './background'
import { storePrefs, useAppearancePref } from './useAppearancePref'
import { backgroundImage } from './useBackgroundImage'

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

type LookPref = (typeof LOOK_PREFS)[number]

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
export function parseLook(raw: Readonly<Record<string, unknown>>): Look {
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

/** This device's look, live, and putting another one on; the picture is `backgroundImage`'s. */
export function useLook() {
    const states = LOOK_PREFS.map(
        (name) => [name, useAppearancePref(name).state] as const,
    )
    const look = computed(
        (): Look => ({
            ...(Object.fromEntries(
                states.map(([name, state]) => [name, state.value]),
            ) as { [K in LookPref]: PrefValue<K> }),
            blur: String(backgroundImage.blur.value),
            dim: String(backgroundImage.dim.value),
        }),
    )

    function apply(next: Look, origin?: RevealOrigin) {
        const { blur, dim, ...prefs } = next
        void revealThemeChange(() => {
            storePrefs(prefs)
            backgroundImage.setBlur(Number(blur))
            backgroundImage.setDim(Number(dim))
        }, origin)
    }

    return { look, apply }
}
