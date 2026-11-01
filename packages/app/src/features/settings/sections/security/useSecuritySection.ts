import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { useLockPolicy } from '#features/vault'

import { useLockAfterOptions } from '../../composables/useLockAfterOptions'

export function useSecuritySection() {
    const { t } = useI18n()
    const lockPolicy = useLockPolicy()
    const lock = useLockAfterOptions()
    // PIN and Hello are not wired yet: local switches, as before.
    const pin = ref(true)
    const biometrics = ref(false)

    const pinDescription = computed(() =>
        pin.value
            ? t('6 digits · this device only')
            : t('Quick unlock on this device only'),
    )

    return {
        lockItems: lock.items,
        lockAfter: computed(() => lockPolicy.policy.lockAfter),
        setLockAfter: lockPolicy.setLockAfter,
        neverLocks: computed(() => lockPolicy.policy.lockAfter === 'never'),
        masterAfterRestart: computed(
            () => lockPolicy.policy.masterAfterRestart,
        ),
        setMasterAfterRestart: lockPolicy.setMasterAfterRestart,
        pin,
        pinDescription,
        setPin: (on: boolean) => {
            pin.value = on
        },
        changePin() {
            // The PIN setup flow arrives with the PIN slot; the button only states the intent.
        },
        biometrics,
        setBiometrics: (on: boolean) => {
            biometrics.value = on
        },
    }
}
