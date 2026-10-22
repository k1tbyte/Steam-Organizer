import type { RouterHistory } from 'vue-router'

import App from './App.vue'
import type { Platform } from './core'
import { createEntry } from './entry'
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
    return createEntry(App, platform).use(createAppRouter(history)).mount(el)
}
