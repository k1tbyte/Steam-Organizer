import { createPinia } from 'pinia'
import { createApp, watch } from 'vue'
import type { RouterHistory } from 'vue-router'

import App from './App.vue'
import {
    PLATFORM,
    type Platform,
    restoreAppearance,
    startMocks,
    useAppearancePref,
} from './core'
import { i18n } from './i18n'
import { createAppRouter } from './router'

export type { Platform } from './core'

export interface MountOptions {
    platform: Platform
    history: RouterHistory
}

export function mountApp(
    el: string | Element,
    { platform, history }: MountOptions,
) {
    startMocks(import.meta.env.DEV)
    // Before mount: the first paint is already themed.
    restoreAppearance()
    // The locale follows the language pref; screens only set the pref.
    watch(
        useAppearancePref('language').state,
        (language) => {
            i18n.global.locale.value = language
        },
        { immediate: true },
    )
    return createApp(App)
        .use(createPinia())
        .use(createAppRouter(history))
        .use(i18n)
        .provide(PLATFORM, platform)
        .mount(el)
}
