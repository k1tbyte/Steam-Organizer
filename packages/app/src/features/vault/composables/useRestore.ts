import type { AsyncStatus } from '@so/ui'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { useMock } from '#core'

import { backupsMock, DEMO_PASSWORD, driveAccountMock } from '../mocks'
import { useVaultSession } from '../stores/useVaultSession'

export function useRestore() {
    const { t } = useI18n()
    const session = useVaultSession()
    const account = useMock(() => undefined, driveAccountMock)
    const backups = useMock(() => undefined, backupsMock)

    // `null` is a Drive with no backup; `undefined` is no Drive source at all.
    const status = computed<AsyncStatus>(() =>
        backups.value ? 'ready' : 'empty',
    )

    const restoreLabel = computed(() =>
        t('Restore {count} accounts', {
            count: backups.value?.latest.accounts ?? 0,
        }),
    )

    const password = ref('')
    const wrong = ref(false)
    // Never resets: the field shakes on every wrong password.
    const failedAttempts = ref(0)
    watch(password, () => {
        wrong.value = false
    })

    function restore() {
        wrong.value = password.value !== DEMO_PASSWORD
        // The restored vault opens straight away.
        if (wrong.value) failedAttempts.value++
        else session.open()
    }

    function switchAccount() {
        // Waits on Google sign-in.
    }

    function showOtherBackups() {
        // Waits on the Drive backup list.
    }

    return {
        account,
        backups,
        status,
        restoreLabel,
        password,
        wrong,
        failedAttempts,
        restore,
        switchAccount,
        showOtherBackups,
    }
}
