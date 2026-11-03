import { DriveError, listCopies, readCopy, type VaultFile } from '@so/core'
import { useTimer } from '@so/ui/useTimer'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { reportError } from '#core'
import { useDrive, useDriveSignIn } from '#features/drive'

import { useVaultSession } from '../stores/useVaultSession'
import type { UnlockContext } from './useUnlockPin'

const PASSWORD_TRIES_BEFORE_PAUSE = 5
const PASSWORD_PAUSE_MS = 30_000

export function useUnlockPassword({
    vault,
    attempt,
    isStale,
    succeed,
    failedAttempts,
}: UnlockContext) {
    const { t } = useI18n()
    const session = useVaultSession()
    const drive = useDrive()
    const signIn = useDriveSignIn()
    const pauseTimer = useTimer()

    const password = ref('')
    const passwordError = ref('')
    const wrongPasswords = ref(0)
    const passwordPaused = ref(false)
    // The password is being checked, and after a refusal maybe against the Drive copy.
    const checkingPassword = ref(false)
    // The vault whose password was last refused without its Drive copy checked.
    const refused = ref<string>()
    if (session.vaults.some(({ sync }) => sync)) drive.prepare()

    watch(password, () => {
        if (!passwordPaused.value) passwordError.value = ''
    })

    // A linked vault's copy may carry a password changed on another device. Only a silent token: no Google window here.
    async function driveCopy(id: string): Promise<VaultFile | undefined> {
        const sync = session.vaults.find((item) => item.id === id)?.sync
        const email = drive.account.value?.email
        if (!sync || drive.state.value !== 'connected') return undefined
        if (sync.account !== null && sync.account !== email) return undefined
        try {
            return await drive.run(async (api) => {
                const [copy] = await listCopies(api, id)
                return copy && readCopy(api, copy.id)
            })
        } catch (error) {
            if (!(error instanceof DriveError)) reportError(error, 'vault')
            return undefined
        }
    }

    async function submitPassword() {
        if (password.value === '' || passwordPaused.value) return
        if (checkingPassword.value) return
        checkingPassword.value = true
        const result = await attempt(
            { method: 'pw', password: password.value },
            driveCopy,
        ).finally(() => {
            checkingPassword.value = false
        })
        if (result === null) return
        if (result === 'opened') return succeed()
        if (result === 'unreadable') {
            passwordError.value = t(
                "Can't open this vault: the file is damaged or newer",
            )
            return
        }
        wrongPasswords.value++
        failedAttempts.value++
        refused.value = vault.value?.id
        if (wrongPasswords.value >= PASSWORD_TRIES_BEFORE_PAUSE) {
            passwordPaused.value = true
            passwordError.value = t('Too many attempts. Try again in 30 s.')
            pauseTimer.arm(PASSWORD_PAUSE_MS, () => {
                passwordPaused.value = false
                wrongPasswords.value = 0
                passwordError.value = ''
            })
            return
        }
        passwordError.value = t(
            'Wrong password. {left} attempts before a 30 s pause.',
            {
                left: PASSWORD_TRIES_BEFORE_PAUSE - wrongPasswords.value,
            },
        )
    }

    // After a reload the web has no token: a password changed on another device needs Google to reach the copy.
    const canCheckCopy = computed(
        () =>
            refused.value === vault.value?.id &&
            vault.value?.location === 'drive' &&
            !passwordPaused.value &&
            (drive.state.value === 'disconnected' ||
                drive.state.value === 'expired'),
    )

    async function checkCopy() {
        const forVault = vault.value?.id
        if (!(await signIn()) || isStale(forVault)) return
        await submitPassword()
    }

    return {
        password,
        passwordError,
        checkingPassword,
        submitPassword,
        canCheckCopy,
        checkCopy,
        signingIn: drive.connecting,
    }
}
