import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import type { SecuritySettings, SiteKey } from '../model'

/** What this device holds for the settings sections. Each part moves to its owner when wired
 *  (vault settings, Steam access); `null` and empty mean "not changed here yet". */
export const useSettingsStore = defineStore('settings', () => {
    const security = ref<SecuritySettings>({
        lockAfter: '15m',
        masterAfterRestart: false,
        pin: true,
        biometrics: false,
    })
    const allowedSites = ref<SiteKey[]>([])

    function setSecurity(patch: Partial<SecuritySettings>) {
        security.value = { ...security.value, ...patch }
    }

    function allowSite(key: SiteKey) {
        if (!allowedSites.value.includes(key))
            allowedSites.value = [...allowedSites.value, key]
    }

    return {
        security: computed(() => security.value),
        allowedSites: computed(() => allowedSites.value),
        setSecurity,
        allowSite,
    }
})
