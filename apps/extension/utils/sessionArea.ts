import type { SessionArea } from '@so/app'
import { browser } from 'wxt/browser'

/** `storage.session`: shared by the app page and the popup, gone at browser restart. */
export const extensionSession: SessionArea = {
    restartBound: true,
    async get(key) {
        const found = await browser.storage.session.get(key)
        return typeof found[key] === 'string' ? found[key] : undefined
    },
    set: (key, value) => browser.storage.session.set({ [key]: value }),
    remove: (key) => browser.storage.session.remove(key),
    watch(key, listener) {
        const hear = (
            changes: Record<string, { newValue?: unknown }>,
            area: string,
        ) => {
            if (area !== 'session' || !(key in changes)) return
            const value = changes[key]?.newValue
            listener(typeof value === 'string' ? value : undefined)
        }
        browser.storage.onChanged.addListener(hear)
        return () => browser.storage.onChanged.removeListener(hear)
    },
}
