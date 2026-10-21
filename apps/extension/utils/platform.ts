import type { Platform } from '@so/app'
import { browser } from 'wxt/browser'

import type { OpenAppMessage } from './messages'

/** The full app page, opened on a route. */
export function openAppPage(path: string) {
    const url = `${browser.runtime.getURL('/app.html')}#${path}`
    return browser.tabs.create({ url })
}

/** What every extension page can do; the popup adds opening the app. */
export const extensionPlatform: Platform = {
    kind: 'extension',
    fetch: globalThis.fetch.bind(globalThis),
}

/** The popup closes once it hands over to the app tab. */
export const popupPlatform: Platform = {
    ...extensionPlatform,
    openApp(path) {
        void openAppPage(path).then(() => window.close())
    },
}

/** Content scripts reach tabs only through the background. */
export const contentPlatform: Platform = {
    ...extensionPlatform,
    openApp(path) {
        const message: OpenAppMessage = { type: 'open-app', path }
        void browser.runtime.sendMessage(message)
    },
}
