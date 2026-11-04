import { type PresetData, RECORD, readPreset } from '@so/core'

import type { Picture } from '#core/appearance/background'
import { type Look, parseLook } from '#core/appearance/look'
import { MAX_PRESET_NAME, type Preset } from '../model'

export function presetName(text: string): string {
    return text.trim().replace(/\s+/g, ' ').slice(0, MAX_PRESET_NAME)
}

/** A preset's record data: the one place it takes shape. */
export function presetData(
    name: string,
    look: Look,
    image: Picture | null,
): PresetData {
    return {
        kind: RECORD.PRESET,
        name,
        look,
        ...(image && { image: { id: image.id, colors: image.colors } }),
    }
}

/** The picture a look puts on: an Image background's (null: the sample), else none. */
export const pictureOf = (look: Look, id: string | undefined) =>
    look.background === 'image' ? (id ?? null) : null

/** The presets this vault holds, by name. */
export function ownPresets(data: ReadonlyMap<string, unknown>): Preset[] {
    const presets: Preset[] = []
    for (const [id, value] of data) {
        const preset = readPreset(value)
        if (preset)
            presets.push({
                id,
                name: preset.name,
                look: parseLook(preset.look),
                image: preset.image
                    ? { id: preset.image.id, colors: preset.image.colors }
                    : null,
                builtIn: false,
            })
    }
    return presets.sort((a, b) => a.name.localeCompare(b.name))
}

/** Names are unique ignoring case and spacing, the shown built-in names included. */
export function findPreset(
    presets: readonly Preset[],
    name: string,
): Preset | undefined {
    const key = presetName(name).toLowerCase()
    return presets.find((preset) => preset.name.toLowerCase() === key)
}
