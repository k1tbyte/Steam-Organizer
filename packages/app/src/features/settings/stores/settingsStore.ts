import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import type { SiteKey } from '../model'

/** What this device holds for the settings sections. Each part moves to its owner when wired
 *  (Steam access); empty means "not changed here yet". */
export const useSettingsStore = defineStore('settings', () => {
    const allowedSites = ref<SiteKey[]>([])

    function allowSite(key: SiteKey) {
        if (!allowedSites.value.includes(key))
            allowedSites.value = [...allowedSites.value, key]
    }

    return {
        allowedSites: computed(() => allowedSites.value),
        allowSite,
    }
})
