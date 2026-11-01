import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { SECURITY_SETTINGS_STORAGE_KEY, writeStored } from '#core'

import {
    type LockAfter,
    SECURITY_DEFAULTS,
    type SecuritySettings,
} from '../model'
import { readSecuritySettings } from '../services/lockPolicy'
import { useVaultSession } from './useVaultSession'

/** Lock after and Master password after restart, kept per device. A change moves the kept session at once. */
export const useLockPolicy = defineStore('lock-policy', () => {
    const settings = ref<SecuritySettings>(readSecuritySettings())

    function change(patch: Partial<SecuritySettings>) {
        // Read again: the popup or the app page may have changed the other field since.
        const previous = readSecuritySettings()
        settings.value = { ...previous, ...patch }
        writeStored(
            SECURITY_SETTINGS_STORAGE_KEY,
            JSON.stringify(settings.value),
        )
        return useVaultSession().policyChanged(previous)
    }

    return {
        policy: computed(() => settings.value),
        defaults: SECURITY_DEFAULTS,
        setLockAfter: (lockAfter: LockAfter) => change({ lockAfter }),
        setMasterAfterRestart: (masterAfterRestart: boolean) =>
            change({ masterAfterRestart }),
    }
})
