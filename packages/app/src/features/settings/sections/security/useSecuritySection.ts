import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { useLockPolicy, useVaultSecurity } from '#features/vault'

import { useLockAfterOptions } from '../../composables/useLockAfterOptions'

export function useSecuritySection() {
    const { t } = useI18n()
    const lockPolicy = useLockPolicy()
    const security = useVaultSecurity()
    const lock = useLockAfterOptions()
    // Hello is not wired yet: a local switch, as before.
    const biometrics = ref(false)

    const pinDescription = computed(() => {
        if (security.pin === 'paused')
            return t(
                'Paused after 3 wrong tries. Unlock with the master password once.',
            )
        return security.pin === 'on'
            ? t('6 digits · this device only')
            : t('Quick unlock on this device only')
    })

    return {
        lockItems: lock.items,
        lockAfter: computed(() => lockPolicy.policy.lockAfter),
        setLockAfter: lockPolicy.setLockAfter,
        neverLocks: computed(() => lockPolicy.policy.lockAfter === 'never'),
        masterAfterRestart: computed(
            () => lockPolicy.policy.masterAfterRestart,
        ),
        setMasterAfterRestart: lockPolicy.setMasterAfterRestart,
        /** A PIN slot exists, paused or not: Change and Remove apply. */
        pin: computed(() => security.pin !== 'off'),
        pinDescription,
        removePin: security.removePin,
        biometrics,
        setBiometrics: (on: boolean) => {
            biometrics.value = on
        },
    }
}
