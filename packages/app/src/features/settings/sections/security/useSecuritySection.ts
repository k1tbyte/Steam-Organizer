import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useLockAfterOptions } from '../../composables/useLockAfterOptions'
import type { LockAfter } from '../../model'
import { useSettingsStore } from '../../stores/settingsStore'

export function useSecuritySection() {
    const { t } = useI18n()
    const store = useSettingsStore()
    const lock = useLockAfterOptions()

    const pinDescription = computed(() =>
        store.security.pin
            ? t('6 digits · this device only')
            : t('Quick unlock on this device only'),
    )

    function setLockAfter(value: LockAfter) {
        store.setSecurity({ lockAfter: value })
    }

    function setMasterAfterRestart(on: boolean) {
        store.setSecurity({ masterAfterRestart: on })
    }

    function setPin(on: boolean) {
        store.setSecurity({ pin: on })
    }

    function setBiometrics(on: boolean) {
        store.setSecurity({ biometrics: on })
    }

    function changePin() {
        // The PIN setup flow arrives with the vault feature; the button only states the intent.
    }

    return {
        lockItems: lock.items,
        lockAfter: computed(() => store.security.lockAfter),
        setLockAfter,
        neverLocks: computed(() => store.security.lockAfter === 'never'),
        masterAfterRestart: computed(() => store.security.masterAfterRestart),
        setMasterAfterRestart,
        pin: computed(() => store.security.pin),
        pinDescription,
        setPin,
        changePin,
        biometrics: computed(() => store.security.biometrics),
        setBiometrics,
    }
}
