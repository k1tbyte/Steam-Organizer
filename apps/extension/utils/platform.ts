import type { Platform } from '@so/app'
import { browser } from 'wxt/browser'

import { extensionGoogle } from './google'
import type { OpenAppMessage } from './messages'
import { extensionSession } from './sessionArea'

/** The full app page, opened on a route. */
export function openAppPage(path: string) {
    const url = `${browser.runtime.getURL('/app.html')}#${path}`
    return browser.tabs.create({ url })
}

// Firefox's moz-extension host is a per-profile UUID, so a passkey made on it would not survive another profile:
// no RP ID there, and Hello shows as unavailable. Chrome's is the extension ID, which the manifest key keeps stable.
const chromium = browser.runtime.getURL('/').startsWith('chrome-extension:')

/** What every extension page can do; the popup adds opening the app. */
export const extensionPlatform: Platform = {
    kind: 'extension',
    fetch: globalThis.fetch.bind(globalThis),
    google: extensionGoogle,
    session: extensionSession,
    ...(chromium && { passkeys: { rpId: browser.runtime.id } }),
}

/** The popup closes once it hands over to the app tab. */
export const popupPlatform: Platform = {
    ...extensionPlatform,
    openApp(path) {
        void openAppPage(path).then(() => window.close())
    },
}

/** Content scripts reach tabs only through the background, and sign in to nothing. */
export const contentPlatform: Platform = {
    ...extensionPlatform,
    google: null,
    openApp(path) {
        const message: OpenAppMessage = { type: 'open-app', path }
        void browser.runtime.sendMessage(message)
    },
}
