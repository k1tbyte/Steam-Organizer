import { AutofillApp } from '#features/autofill'

import type { Platform } from './core'
import { createEntry } from './entry'

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
