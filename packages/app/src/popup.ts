import { QuickAccessApp } from '#features/quick-access'

import type { Platform } from './core'
import { createEntry } from './entry'

/** The toolbar popup: the account palette, no router. */
export function mountPopup(el: string | Element, platform: Platform) {
    return createEntry(QuickAccessApp, platform).mount(el)
}
