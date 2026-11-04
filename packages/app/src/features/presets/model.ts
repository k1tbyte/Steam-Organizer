import { ACCENT_PRESETS } from '@so/ui/accents'

import type { Look, Picture } from '#core'

/** A preset as screens show it: a built-in one, or one saved in the vault. */
export interface Preset {
    /** The built-in id, or the PRESET record's. */
    id: string
    name: string
    look: Look
    /** The Image background's picture; null is the sample. */
    image: Picture | null
    builtIn: boolean
}

export const MAX_PRESET_NAME = 32

/** Read-only looks of every vault, set apart from the defaults; a device follows one by id: never rename one. */
export const BUILT_IN_PRESETS = [
    { id: 'midnight', name: 'Midnight', look: {} },
    {
        id: 'night-glass',
        name: 'Night glass',
        look: { surface: 'glass', background: 'image' },
    },
    {
        id: 'daylight',
        name: 'Daylight',
        look: {
            mode: 'light',
            accent: ACCENT_PRESETS.amber,
            tint: 'off',
            radius: '12',
        },
    },
    {
        id: 'blueprint',
        name: 'Blueprint',
        look: {
            accent: ACCENT_PRESETS.cyan,
            surface: 'subtle',
            background: 'grid',
            radius: '4',
            density: 'compact',
        },
    },
    {
        id: 'focus',
        name: 'Focus',
        look: {
            accent: ACCENT_PRESETS.emerald,
            tint: 'off',
            radius: '6',
            density: 'compact',
        },
    },
] as const
