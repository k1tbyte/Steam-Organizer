import { useTimer } from '@so/ui/useTimer'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import type { SecuritySettings, SiteKey, SyncSettings } from '../model'

const SYNC_NOW_MS = 1200

/** What this device holds for the settings sections. Each part moves to its owner when wired
 *  (vault settings, Drive sync, Steam access); `null` and empty mean "not changed here yet". */
export const useSettingsStore = defineStore('settings', () => {
    const security = ref<SecuritySettings>({
        lockAfter: '15m',
        masterAfterRestart: false,
        pin: true,
        biometrics: false,
    })
    const sync = ref<SyncSettings>({
        connected: true,
        autoSync: true,
        interval: '15',
        autoBackup: true,
    })
    const syncing = ref(false)
    const syncedJustNow = ref(false)
    const allowedSites = ref<SiteKey[]>([])

    const timer = useTimer()

    function setSecurity(patch: Partial<SecuritySettings>) {
        security.value = { ...security.value, ...patch }
    }

    function setSync(patch: Partial<SyncSettings>) {
        sync.value = { ...sync.value, ...patch }
    }

    function syncNow() {
        syncing.value = true
        timer.arm(SYNC_NOW_MS, () => {
            syncing.value = false
            syncedJustNow.value = true
        })
    }

    function allowSite(key: SiteKey) {
        if (!allowedSites.value.includes(key))
            allowedSites.value = [...allowedSites.value, key]
    }

    return {
        security: computed(() => security.value),
        sync: computed(() => sync.value),
        syncing: computed(() => syncing.value),
        syncedJustNow: computed(() => syncedJustNow.value),
        allowedSites: computed(() => allowedSites.value),
        setSecurity,
        setSync,
        syncNow,
        allowSite,
    }
})
