import type { VaultHostServe } from '@so/app/vault-host'
import { browser } from 'wxt/browser'

import { isVaultHostMessage } from './messages'
import { isExtensionPage } from './senders'

/** The offscreen host's transport: only what the background forwards (`sender.tab` is absent), answered with
 *  `sendResponse` because Chrome ignores a promise returned from `onMessage`. */
export const serveForwarded: VaultHostServe = (handler) => {
    const hear = (
        message: unknown,
        sender: Parameters<typeof isExtensionPage>[0],
        sendResponse: (answer?: unknown) => void,
    ) => {
        if (
            !isVaultHostMessage(message) ||
            !isExtensionPage(sender, browser.runtime.id)
        )
            return false
        handler(message.message, message.tabId).then(sendResponse, () =>
            sendResponse(undefined),
        )
        return true
    }
    browser.runtime.onMessage.addListener(hear)
    return () => browser.runtime.onMessage.removeListener(hear)
}
