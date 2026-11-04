import { browser } from 'wxt/browser'

import type { VaultHostMessage } from './messages'

const HOST_PAGE = 'vault-host.html'
const RETRIES = 10
const RETRY_MS = 150

let creating: Promise<void> | undefined

// `offscreen.hasDocument` is Chrome 150+; `runtime.getContexts` (116+) says the same.
async function hasHost() {
    const found = await browser.runtime.getContexts({
        contextTypes: [browser.runtime.ContextType.OFFSCREEN_DOCUMENT],
    })
    return found.length > 0
}

/** Chrome: the offscreen document that holds the vault, created on the first autofill request. */
async function ensureHost() {
    if (!creating && (await hasHost())) return
    creating ??= browser.offscreen
        .createDocument({
            url: HOST_PAGE,
            reasons: [browser.offscreen.Reason.LOCAL_STORAGE],
            justification:
                'Holds the open vault for autofill: the lock policy and the vault live in this extension origin',
        })
        .catch((error) => {
            // A request that raced this one made it first.
            if (!/single offscreen/i.test(String(error))) throw error
        })
        .finally(() => {
            creating = undefined
        })
    await creating
}

/** Sends an autofill message to the host with its tab, and returns the answer. A document only just made may not be
 *  listening yet, so a miss tries again a few times. */
export async function forwardToHost(tabId: number, message: unknown) {
    await ensureHost()
    const envelope: VaultHostMessage = { type: 'vault-host', tabId, message }
    for (let attempt = 1; ; attempt++) {
        try {
            return await browser.runtime.sendMessage(envelope)
        } catch (error) {
            if (attempt >= RETRIES) throw error
            await new Promise((resolve) => setTimeout(resolve, RETRY_MS))
        }
    }
}
