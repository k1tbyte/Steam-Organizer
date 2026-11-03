import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useHelloLabel, useLockPolicy, useVaultSecurity } from '#features/vault'

import { useLockAfterOptions } from '../../composables/useLockAfterOptions'

/** Turning PIN or Hello on asks for the master password in the section's dialog; turning it off asks nothing. */
interface Ask {
    (event: 'setPin'): void
    (event: 'enableHello'): void
}

export function useSecuritySection(ask: Ask) {
    const { t } = useI18n()
    const lockPolicy = useLockPolicy()
    const security = useVaultSecurity()
    const lock = useLockAfterOptions()
    // What the OS calls it: Windows Hello, Touch ID, Fingerprint, Passkey.
    const hello = useHelloLabel()

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
        /** Empty unless the vault never locks by itself. */
        neverWarning: computed(() =>
            lockPolicy.policy.lockAfter === 'never'
                ? t(
                      'The vault stays open in this browser until you lock it yourself. Anyone with this browser profile can open it.',
                  )
                : '',
        ),
        rows: computed(() => ({
            pin: {
                label: t('PIN'),
                description: pinDescription.value,
                // A PIN slot exists, paused or not: Change and Remove apply.
                on: security.pin !== 'off',
                disabled: false,
                set: (on: boolean) =>
                    on ? ask('setPin') : security.removePin(),
            },
            hello: {
                label: hello.value,
                description:
                    security.hello === 'unavailable'
                        ? t('Not available on this device')
                        : t('A passkey on this device opens the vault'),
                on: security.hello === 'on',
                disabled: security.hello === 'unavailable',
                set: (on: boolean) =>
                    on ? ask('enableHello') : security.disableHello(),
            },
            restart: {
                label: t('Master password after browser restart'),
                description: t(
                    "PIN and {hello} work again once you've unlocked with it",
                    { hello: hello.value },
                ),
                on: lockPolicy.policy.masterAfterRestart,
                disabled: false,
                set: lockPolicy.setMasterAfterRestart,
            },
        })),
    }
}
