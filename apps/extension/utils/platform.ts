import type { Platform } from '@so/app'
import { browser } from 'wxt/browser'

import { extensionGoogle } from './google'
import type { OpenAppMessage } from './messages'
import { relaySession } from './relaySession'
import { isExtensionPage } from './senders'
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

/** The popup closes once it hands over to the app tab, and reaches the active tab's content script (`activeTab` gives
 *  the tab; the address comes from the content script, so no `tabs` permission). */
export const popupPlatform: Platform = {
    ...extensionPlatform,
    openApp(path) {
        void openAppPage(path).then(() => window.close())
    },
    activeTab: {
        async request(message) {
            const [tab] = await browser.tabs.query({
                active: true,
                currentWindow: true,
            })
            if (tab?.id === undefined) return undefined
            try {
                return await browser.tabs.sendMessage(tab.id, message, {
                    frameId: 0,
                })
            } catch {
                // No content script there: not a Steam login page.
                return undefined
            }
        },
    },
}

/** The vault host on Firefox: the background page itself, with `storage.session` at hand and nothing to sign in to. */
export const backgroundHostPlatform: Platform = {
    ...extensionPlatform,
    google: null,
}

/** The vault host on Chrome: an offscreen document has `runtime` only, so its session area goes through the background. */
export const offscreenPlatform: Platform = {
    ...backgroundHostPlatform,
    session: relaySession,
}

/** Content scripts reach tabs only through the background, and sign in to nothing. They hold no vault: `vaultHost` is
 *  their way to it, `onTabRequest` how they hear the popup. */
export const contentPlatform: Platform = {
    ...extensionPlatform,
    google: null,
    openApp(path) {
        const message: OpenAppMessage = { type: 'open-app', path }
        void browser.runtime.sendMessage(message)
    },
    // The vault stays in the host: the content script asks it for rows and one fill at a time.
    vaultHost: { request: (message) => browser.runtime.sendMessage(message) },
    onTabRequest(handler) {
        const hear = (
            message: unknown,
            sender: Parameters<typeof isExtensionPage>[0],
            sendResponse: (answer?: unknown) => void,
        ) => {
            // Only the popup and other pages of this extension: a web page cannot reach `runtime.onMessage` at all.
            if (!isExtensionPage(sender, browser.runtime.id)) return false
            const answer = handler(message)
            if (answer === undefined) return false
            Promise.resolve(answer).then(sendResponse, () =>
                sendResponse(undefined),
            )
            return true
        }
        browser.runtime.onMessage.addListener(hear)
        return () => browser.runtime.onMessage.removeListener(hear)
    },
}
