import type { SessionArea } from '@so/app'
import { browser } from 'wxt/browser'

import {
    isSessionChanged,
    type SessionChangedMessage,
    type SessionRelayMessage,
} from './messages'
import { isExtensionPage } from './senders'

const watchers = new Set<{
    key: string
    listener: (value: string | undefined) => void
}>()
let hearing = false

// The background pushes every session change, this page's own writes too, as `storage.onChanged` would.
function hearChanges() {
    if (hearing) return
    hearing = true
    browser.runtime.onMessage.addListener((message, sender) => {
        if (
            !isSessionChanged(message) ||
            !isExtensionPage(sender, browser.runtime.id)
        )
            return
        const { key, value }: SessionChangedMessage = message
        for (const watcher of watchers)
            if (watcher.key === key) watcher.listener(value)
    })
}

const relay = (message: SessionRelayMessage): Promise<unknown> =>
    browser.runtime.sendMessage(message)

/** The session area of a page that has only `runtime` (Chrome's offscreen document): the background owns the
 *  `storage.session` calls and pushes its changes back. */
export const relaySession: SessionArea = {
    restartBound: true,
    async get(key) {
        const value = await relay({ type: 'session-relay', op: 'get', key })
        return typeof value === 'string' ? value : undefined
    },
    async set(key, value) {
        await relay({ type: 'session-relay', op: 'set', key, value })
    },
    async remove(key) {
        await relay({ type: 'session-relay', op: 'remove', key })
    },
    watch(key, listener) {
        hearChanges()
        const watcher = { key, listener }
        watchers.add(watcher)
        return () => watchers.delete(watcher)
    },
}
