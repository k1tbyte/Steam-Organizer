import {
    type HostHandler,
    mountVaultHost,
    tabFillKey,
} from '@so/app/vault-host'
import { browser } from 'wxt/browser'
import { defineBackground } from 'wxt/utils/define-background'

import {
    isAutofillMessage,
    isOpenAppMessage,
    isSessionRelay,
    type SessionChangedMessage,
    type SessionRelayMessage,
} from '../utils/messages'
import { forwardToHost } from '../utils/offscreen'
import { backgroundHostPlatform, openAppPage } from '../utils/platform'
import { autofillTabId, isExtensionPage } from '../utils/senders'

async function relayed(message: SessionRelayMessage) {
    const { key } = message
    if (message.op === 'set')
        return browser.storage.session.set({ [key]: message.value })
    if (message.op === 'remove') return browser.storage.session.remove(key)
    const found = await browser.storage.session.get(key)
    return found[key]
}

export default defineBackground(() => {
    let hosted: HostHandler | undefined

    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        const answer = (work: Promise<unknown>) => {
            // Chrome ignores a promise returned from here: answer with `sendResponse` and keep the channel open.
            work.then(sendResponse, () => sendResponse(undefined))
            return true
        }
        if (isOpenAppMessage(message)) {
            void openAppPage(message.path)
            return false
        }
        if (isAutofillMessage(message)) {
            const tabId = autofillTabId(sender, browser.runtime.id)
            if (tabId === undefined) return false
            return answer(
                hosted ? hosted(message, tabId) : forwardToHost(tabId, message),
            )
        }
        if (
            isSessionRelay(message) &&
            isExtensionPage(sender, browser.runtime.id)
        )
            return answer(relayed(message))
        return false
    })

    // The offscreen host cannot hear `storage.onChanged`: pushed to it, where nothing listens it is dropped.
    if (!import.meta.env.FIREFOX)
        browser.storage.onChanged.addListener((changes, area) => {
            if (area !== 'session') return
            for (const [key, { newValue }] of Object.entries(changes)) {
                // The host's keys only: the Drive token is not its business.
                if (!key.startsWith('so:')) continue
                const pushed: SessionChangedMessage = {
                    type: 'session-changed',
                    key,
                    ...(typeof newValue === 'string' && { value: newValue }),
                }
                browser.runtime.sendMessage(pushed).catch(() => {})
            }
        })

    // A closed tab's last fill is gone with it.
    browser.tabs.onRemoved.addListener((tabId) => {
        void browser.storage.session.remove(tabFillKey(tabId))
    })

    // Firefox: this page, an event page with a DOM and `storage.session`, is the vault host.
    // Chrome: an offscreen document is (`vault-host`), reached by forwarding.
    if (import.meta.env.FIREFOX)
        mountVaultHost(backgroundHostPlatform, (handler) => {
            hosted = handler
            return () => {
                hosted = undefined
            }
        })
})
