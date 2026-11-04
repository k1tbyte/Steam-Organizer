import { computed } from 'vue'

import { type Look, type Picture, pictureThumb, resolveMode } from '#core'

const GAP = { compact: 3, comfortable: 4.5, spacious: 6 }

/** A look drawn in its own colours: a tile previews another mode than the page's. */
export function usePresetPreview(props: {
    readonly look: Look
    readonly image: Picture | null
}) {
    const picture = computed(() =>
        props.look.background === 'image' ? pictureThumb(props.image) : null,
    )
    return {
        mode: computed(() => resolveMode(props.look.mode)),
        picture,
        vars: computed(() => {
            const radius = Number(props.look.radius)
            return {
                '--pv-accent': props.look.accent,
                '--pv-r': `${Math.round(radius * 0.5)}px`,
                '--pv-pr': `${Math.min(5, radius * 0.3)}px`,
                '--pv-gap': `${GAP[props.look.density]}px`,
                '--pv-pic': picture.value ? `url("${picture.value}")` : 'none',
                '--pv-picblur': `${Number(props.look.blur) * 0.14}px`,
                '--pv-dim': `${props.look.dim}%`,
            }
        }),
    }
}
