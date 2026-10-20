import { createPinia } from 'pinia'
import { createApp } from 'vue'
import type { RouterHistory } from 'vue-router'

import App from './App.vue'
import { PLATFORM, type Platform, restoreAppearance, startMocks } from './core'
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
    // Before mount: the first paint is already themed and `lang` is already the stored language.
    restoreAppearance()
    i18n.global.locale.value = document.documentElement.lang as 'en'
    return createApp(App)
        .use(createPinia())
        .use(createAppRouter(history))
        .use(i18n)
        .provide(PLATFORM, platform)
        .mount(el)
}
