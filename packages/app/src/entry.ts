import { createPinia } from 'pinia'
import { type Component, createApp, watch } from 'vue'

import {
    PLATFORM,
    type Platform,
    restoreAppearance,
    startMocks,
    useAppearancePref,
} from './core'
import { i18n } from './i18n'

/** What every entry shares: themed before the first paint, mocks, language, state, platform. */
export function createEntry(
    root: Component,
    platform: Platform,
    themed?: HTMLElement,
) {
    startMocks(import.meta.env.DEV)
    restoreAppearance(themed)
    // The locale follows the language pref; screens only set the pref.
    watch(
        useAppearancePref('language').state,
        (language) => {
            i18n.global.locale.value = language
        },
        { immediate: true },
    )
    return createApp(root)
        .use(createPinia())
        .use(i18n)
        .provide(PLATFORM, platform)
}
