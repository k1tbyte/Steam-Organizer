import { type RevealOrigin, revealThemeChange } from '@so/ui/theme-reveal'
import { computed } from 'vue'

import type { PrefValue } from './appearance'
import { LOOK_PREFS, type Look, type LookPref } from './look'
import { storePrefs, useAppearancePref } from './useAppearancePref'
import { backgroundImage } from './useBackgroundImage'

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

    /** `alongside` runs in the same reveal, which waits for its promise: the page never shows the look half put on. */
    function apply(
        next: Look,
        origin?: RevealOrigin,
        alongside?: () => unknown,
    ) {
        const { blur, dim, ...prefs } = next
        void revealThemeChange(() => {
            storePrefs(prefs)
            backgroundImage.setBlur(Number(blur))
            backgroundImage.setDim(Number(dim))
            return alongside?.()
        }, origin)
    }

    return { look, apply }
}
