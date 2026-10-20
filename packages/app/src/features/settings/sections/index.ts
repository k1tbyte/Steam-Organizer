import type { Component } from 'vue'

import type { SectionKey } from '../model'
import AppearanceSection from './appearance/AppearanceSection.vue'
import FieldsSection from './fields/FieldsSection.vue'
import SecuritySection from './security/SecuritySection.vue'
import SteamSection from './steam/SteamSection.vue'
import SyncSection from './sync/SyncSection.vue'
import VaultSection from './vault/VaultSection.vue'

/** A section with no entry here (Bots, planned) shows the pending body. */
export const SECTION_BODIES: Partial<Record<SectionKey, Component>> = {
    appearance: AppearanceSection,
    security: SecuritySection,
    sync: SyncSection,
    fields: FieldsSection,
    vault: VaultSection,
    steam: SteamSection,
}
