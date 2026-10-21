import { type RevealOrigin, revealThemeChange } from '@so/ui/theme-reveal'
import { type Ref, readonly, ref } from 'vue'

import { removeStored, writeStored } from '../storage'
import {
    applyPref,
    isPrefDefault,
    PREF_NAMES,
    type PrefName,
    type PrefValue,
    prefSpec,
    readPref,
} from './appearance'
import { restoreBackground } from './background'

// One shared ref per pref, so the settings screen and any reader see the same value.
const states = new Map<PrefName, Ref<string>>()

function stateOf(name: PrefName): Ref<string> {
    let state = states.get(name)
    if (state === undefined) {
        state = ref(readPref(name))
        states.set(name, state)
    }
    return state
}

/** Token transitions off for one paint, so a retheme does not re-rasterize every glass backdrop. */
function pauseThemeTransitions() {
    const root = document.documentElement
    root.setAttribute('data-theme-swap', '')
    requestAnimationFrame(() => {
        requestAnimationFrame(() => root.removeAttribute('data-theme-swap'))
    })
}

/** Applies every stored pref to <html> (or the shadow host of an injected UI) before mount, so the first paint is themed. */
export function restoreAppearance(
    root: HTMLElement = document.documentElement,
) {
    for (const name of PREF_NAMES) {
        const reapply = () => applyPref(root, name, stateOf(name).value)
        reapply()
        // `system` and `auto` have no stored answer: they follow the device live.
        for (const query of prefSpec(name).follows ?? [])
            matchMedia(query).addEventListener('change', reapply)
    }
    if (stateOf('background').value === 'image') void restoreBackground()
}

/** One appearance pref as state: `set` persists it and applies it to <html> at once. */
export function useAppearancePref<K extends PrefName>(name: K) {
    const state = stateOf(name)

    function set(value: PrefValue<K>, origin?: RevealOrigin) {
        const apply = () => {
            state.value = value
            pauseThemeTransitions()
            const { storageKey } = prefSpec(name)
            if (isPrefDefault(name, value)) removeStored(storageKey)
            else writeStored(storageKey, value)
            applyPref(document.documentElement, name, value)
        }
        // Only a mode change reveals from `origin`; the rest land at once.
        if (name === 'mode') void revealThemeChange(apply, origin)
        else apply()
    }

    return { state: readonly(state) as Readonly<Ref<PrefValue<K>>>, set }
}
