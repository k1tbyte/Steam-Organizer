import { useWindowSize } from '@vueuse/core'
import { computed, ref, watch } from 'vue'

import {
    type Account,
    useAccountPassword,
    useVaultAccounts,
} from '#features/accounts'
import { useFillFeedback } from '#features/quick-access'

import { floatStyle, placeFloat, placeInField } from '../services/placement'
import { useAnchorBox } from './useAnchorBox'
import { fieldsOf, useHostPage } from './useHostPage'
import { useLockNotice } from './useLockNotice'

/** The in-field button, in px. */
const TRIGGER_PX = 30
const TRIGGER_INSET_PX = 7
/** Upper bounds of the floats, for choosing a side and keeping them on screen. */
const PICKER_SIZE = { width: 340, height: 290 }
const GUARD_SIZE = { width: 348, height: 48 }
// The mockup's clearance between the Guard prompt and the code boxes.
const GUARD_GAP_PX = 38

/** The injected UI as a whole: what the page asks for, where the controls sit, and what a fill does. */
export function useAutofill() {
    const host = useHostPage()
    const { accounts } = useVaultAccounts()
    const passwordOf = useAccountPassword()
    const { filled, markFilled } = useFillFeedback()
    const viewport = useWindowSize()

    const pickerOpen = ref(false)
    const guardDismissed = ref(false)
    const lastFilledId = ref<string>()

    const kind = computed(() => host.target.value?.kind)
    watch(host.target, () => {
        pickerOpen.value = false
        guardDismissed.value = false
    })

    const fields = computed(() => fieldsOf(host.target.value))
    // The login controls belong to the login field; the Guard prompt spans every code box.
    const anchor = useAnchorBox(
        computed(() => fields.value[0]),
        computed(() =>
            kind.value === 'guard' ? fields.value.at(-1) : fields.value[0],
        ),
    )
    // A field scrolled out of sight takes its controls with it.
    const inView = computed(
        () =>
            anchor.value.top + anchor.value.height > 0 &&
            anchor.value.top < viewport.height.value,
    )
    const viewportSize = computed(() => ({
        width: viewport.width.value,
        height: viewport.height.value,
    }))

    // The code belongs to the account just filled, even when it has none; a fresh page falls back to the first
    // with an authenticator. Waits on the last-filled account in session storage.
    const guardAccount = computed<Account | undefined>(() => {
        if (lastFilledId.value === undefined)
            return accounts.value.find((a) => a.guard)
        const filledAccount = accounts.value.find(
            (a) => a.id === lastFilledId.value,
        )
        return filledAccount?.guard ? filledAccount : undefined
    })
    const { notice: guardNotice, openApp: openGuardNotice } =
        useLockNotice(guardAccount)

    return {
        showTrigger: computed(() => kind.value === 'login' && inView.value),
        showPicker: computed(() => pickerOpen.value && inView.value),
        showGuard: computed(
            () =>
                kind.value === 'guard' &&
                !guardDismissed.value &&
                inView.value &&
                (guardNotice.value !== undefined ||
                    guardAccount.value !== undefined),
        ),
        triggerStyle: computed(() => {
            const { top, left } = placeInField(
                anchor.value,
                TRIGGER_PX,
                TRIGGER_INSET_PX,
            )
            return { top: `${top}px`, left: `${left}px` }
        }),
        pickerStyle: computed(() =>
            floatStyle(
                placeFloat(anchor.value, PICKER_SIZE, viewportSize.value, {
                    align: 'end',
                    prefer: 'below',
                }),
            ),
        ),
        guardStyle: computed(() =>
            floatStyle(
                placeFloat(anchor.value, GUARD_SIZE, viewportSize.value, {
                    align: 'center',
                    prefer: 'above',
                    gap: GUARD_GAP_PX,
                }),
            ),
        ),
        pickerOpen,
        togglePicker: () => {
            pickerOpen.value = !pickerOpen.value
        },
        closePicker: () => {
            pickerOpen.value = false
        },
        guardAccount,
        guardNotice,
        openGuardNotice,
        filled,
        dismissGuard: () => {
            guardDismissed.value = true
        },
        async fillAccount(account: Account) {
            lastFilledId.value = account.id
            pickerOpen.value = false
            host.fillLogin(account.login, await passwordOf(account))
        },
        fillCode(code: string) {
            host.fillCode(code)
            markFilled()
        },
    }
}
