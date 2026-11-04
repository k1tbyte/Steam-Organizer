import { watch } from 'vue'

import { sameLook } from '#core'

import { pictureOf } from '../services/presets'
import { usePresets } from './usePresets'

/** Puts on edits made elsewhere to the followed preset while this device still wears what it put on. Once per page. */
export function useFollowPreset() {
    const { followed, follow, modified, apply } = usePresets()
    // Immediate: an edit that arrived while no page was open is put on at unlock; one skipped
    // while modified lands once the look is back.
    watch(
        [followed, modified],
        ([preset, isModified]) => {
            const from = follow.value
            if (!preset || !from || isModified) return
            const picture = pictureOf(preset.look, preset.image?.id)
            if (!sameLook(preset.look, from.look) || picture !== from.picture)
                apply(preset)
        },
        { immediate: true },
    )
}
