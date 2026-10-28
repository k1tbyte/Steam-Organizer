import type { RouterHistory } from 'vue-router'

import App from './App.vue'
import type { Platform } from './core'
import { createEntry } from './entry'
import { createAppRouter } from './router'

// What a shell needs to build its `GoogleAuth`.
export {
    DRIVE_SCOPE,
    GOOGLE_CLIENT_ID,
    type GoogleToken,
    googleToken,
} from '@so/core'
export type { GoogleAuth, Platform } from './core'

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
