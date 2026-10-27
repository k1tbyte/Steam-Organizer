import type { AccountCredential } from '@so/core'
import {
    computed,
    onScopeDispose,
    ref,
    type UnwrapNestedRefs,
    watch,
} from 'vue'
import { useI18n } from 'vue-i18n'

import { usePageActive } from '#core'
import {
    type Account,
    type LockInfo,
    useAccountLocks,
    useUnlockForm,
} from '#features/accounts'
import { useVaultSession } from '#features/vault'

import { DEMO_ACCOUNT_PASSWORD } from '../../mocks'

/** The lock gate of one open profile: the account's own password, or the master password where recovery is on.
 *  Leaving the page or locking the vault locks it again. A sample opens with the demo password, on this page only. */
export function useAccountGate(
    account: () => Account,
    lock: () => LockInfo | null,
) {
    const { t } = useI18n()
    const session = useVaultSession()
    const locks = useAccountLocks()
    const held = computed(
        () => session.contents?.data.has(account().id) ?? false,
    )
    const sampleOpen = ref(false)

    function accepts(credential: AccountCredential) {
        if (held.value) return locks.unlock(account().id, credential)
        if ('master' in credential)
            return session.verify({ method: 'pw', password: credential.master })
        return Promise.resolve(credential.password === DEMO_ACCOUNT_PASSWORD)
    }
    const form = useUnlockForm(lock, accepts)

    const locked = computed(
        () =>
            lock() !== null &&
            (held.value ? account().locked : !sampleOpen.value),
    )
    const scope = computed(() => lock()?.scope)

    // Also once the record is gone (deleted from here): Undo must not bring it back open.
    function relock() {
        locks.relock(account().id)
        sampleOpen.value = false
        form.reset()
    }
    // A kept page that goes out of view is left too.
    watch(usePageActive(), (active) => {
        if (!active) relock()
    })
    onScopeDispose(relock)

    return {
        ...form,
        locked,
        /** Everything but the nickname and avatar stays out of sight. */
        hidesProfile: computed(
            () => locked.value && scope.value === 'everything',
        ),
        canRelock: computed(() => lock() !== null && !locked.value),
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
            if (lock() === null) return null
            return locked.value
                ? { label: t('Locked'), icon: 'icon-[lucide--lock-keyhole]' }
                : { label: t('Unlocked'), icon: 'icon-[lucide--lock-open]' }
        }),
        async unlock() {
            if ((await form.submit()) && !held.value) sampleOpen.value = true
        },
        relock,
    }
}
export type AccountGateState = UnwrapNestedRefs<
    ReturnType<typeof useAccountGate>
>
