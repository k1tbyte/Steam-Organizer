import {
    computed,
    type MaybeRefOrGetter,
    ref,
    toValue,
    type UnwrapNestedRefs,
} from 'vue'
import { useI18n } from 'vue-i18n'

import { useVaultSession } from '#features/vault'

import { DEMO_ACCOUNT_PASSWORD } from '../mocks'
import type { AccountLock } from '../model'
import { type GateError, gateError } from '../services/accountLock'

/** The lock gate of one open profile: the account's own password, or the master password where recovery is on.
 *  The unlocked state lives here, so leaving the account or locking the vault (which leaves it) locks it again. */
export function useAccountGate(lock: MaybeRefOrGetter<AccountLock | null>) {
    const { t } = useI18n()
    const session = useVaultSession()

    const unlocked = ref(false)
    const recovering = ref(false)
    const password = ref('')
    const masterPassword = ref('')
    const passwordError = ref<GateError | null>(null)
    const masterError = ref<GateError | null>(null)
    const busy = ref(false)

    // Stands in for opening the account's own key; the vault checks the master password.
    const acceptsPassword = async (entered: string) =>
        entered === DEMO_ACCOUNT_PASSWORD

    async function attempt(
        entered: string,
        accepts: (entered: string) => Promise<boolean>,
    ): Promise<GateError | null> {
        if (entered === '') return 'blank'
        busy.value = true
        try {
            return gateError(entered, await accepts(entered))
        } finally {
            busy.value = false
        }
    }

    function open() {
        unlocked.value = true
        recovering.value = false
        password.value = ''
        masterPassword.value = ''
    }

    const config = computed(() => toValue(lock))
    const locked = computed(() => config.value !== null && !unlocked.value)
    const scope = computed(() => config.value?.scope)

    return {
        locked,
        /** Everything but the nickname and avatar stays out of sight. */
        hidesProfile: computed(
            () => locked.value && scope.value === 'everything',
        ),
        canRelock: computed(() => config.value !== null && unlocked.value),
        scopeText: computed(() =>
            scope.value === 'everything'
                ? t(
                      'Everything except the nickname and avatar is hidden until you enter it.',
                  )
                : t(
                      'Login, password, phone and linked services stay sealed until you enter it, even with the vault open.',
                  ),
        ),
        /** The header's lock chip: absent on an account without its own password. */
        chip: computed(() => {
            if (config.value === null) return null
            return unlocked.value
                ? { label: t('Unlocked'), icon: 'icon-[lucide--lock-open]' }
                : { label: t('Locked'), icon: 'icon-[lucide--lock-keyhole]' }
        }),
        recovering,
        /** Recovery was asked for on an account that has it off: its secrets cannot be restored. */
        recoveryOff: computed(
            () => recovering.value && config.value?.recovery === false,
        ),
        recoveryOn: computed(
            () => recovering.value && config.value?.recovery === true,
        ),
        asksPassword: computed(() => !recovering.value),
        password,
        masterPassword,
        busy,
        passwordError: computed(() => {
            if (passwordError.value === 'blank')
                return t('Enter the account password')
            return passwordError.value === 'wrong' ? t('Wrong password') : ''
        }),
        masterError: computed(() => {
            if (masterError.value === 'blank')
                return t('Enter the master password')
            return masterError.value === 'wrong'
                ? t('Wrong master password')
                : ''
        }),
        clearPasswordError: () => {
            passwordError.value = null
        },
        clearMasterError: () => {
            masterError.value = null
        },
        showRecovery: () => {
            recovering.value = true
        },
        backToPassword: () => {
            recovering.value = false
        },
        async unlock() {
            passwordError.value = await attempt(password.value, acceptsPassword)
            if (passwordError.value === null) open()
        },
        async recover() {
            masterError.value = await attempt(masterPassword.value, (entered) =>
                session.verify({ method: 'pw', password: entered }),
            )
            if (masterError.value === null) open()
        },
        relock() {
            unlocked.value = false
            password.value = ''
        },
    }
}
export type AccountGateState = UnwrapNestedRefs<
    ReturnType<typeof useAccountGate>
>
