import { createPinia } from 'pinia'
import { type Component, createApp, watch } from 'vue'
import type { RouterHistory } from 'vue-router'
import { AutofillApp } from '#features/autofill'
import { QuickAccessApp } from '#features/quick-access'
import App from './App.vue'
import {
    PLATFORM,
    type Platform,
    restoreAppearance,
    startMocks,
    useAppearancePref,
} from './core'
import { i18n } from './i18n'
import { createAppRouter } from './router'

export type { Platform } from './core'

export interface MountOptions {
    platform: Platform
    history: RouterHistory
}

/** What every entry shares: themed before the first paint, mocks, language, state, platform. */
function createEntry(
    root: Component,
    platform: Platform,
    themed?: HTMLElement,
) {
    startMocks(import.meta.env.DEV)
    restoreAppearance(themed)
    // The locale follows the language pref; screens only set the pref.
    watch(
        useAppearancePref('language').state,
        (language) => {
            i18n.global.locale.value = language
        },
        { immediate: true },
    )
    return createApp(root)
        .use(createPinia())
        .use(i18n)
        .provide(PLATFORM, platform)
}

export function mountApp(
    el: string | Element,
    { platform, history }: MountOptions,
) {
    return createEntry(App, platform).use(createAppRouter(history)).mount(el)
}

/** The toolbar popup: the account palette, no router. */
export function mountPopup(el: string | Element, platform: Platform) {
    return createEntry(QuickAccessApp, platform).mount(el)
}

/** The autofill UI inside a content script's shadow root; `host` carries the appearance attributes. */
export function mountAutofill(
    el: Element,
    platform: Platform,
    host: HTMLElement,
) {
    const app = createEntry(AutofillApp, platform, host)
    app.mount(el)
    return app
}
