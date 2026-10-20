import { useQueryOverlay } from '#core'

import type { SectionKey } from '../model'
import { OPENABLE_KEYS } from '../registry'

/** The desktop settings window: `?settings=<section>`, the section is the overlay's value. */
export function useSettingsOverlay() {
    return useQueryOverlay<SectionKey>('settings', { values: OPENABLE_KEYS })
}
