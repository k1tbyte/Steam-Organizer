import { createPinia } from 'pinia'
import { createApp } from 'vue'
import type { RouterHistory } from 'vue-router'

import App from './App.vue'
import { PLATFORM, type Platform, startMocks } from './core'
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
    return createApp(App)
        .use(createPinia())
        .use(createAppRouter(history))
        .use(i18n)
        .provide(PLATFORM, platform)
        .mount(el)
}
