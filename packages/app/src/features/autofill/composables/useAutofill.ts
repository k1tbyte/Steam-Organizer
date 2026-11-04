import { useWindowSize } from '@vueuse/core'
import { computed, type Ref, ref, watch } from 'vue'

import { type PickerAccount, useFillFeedback } from '#features/quick-access'

import { floatStyle, placeFloat, placeInField } from '../services/placement'
import { useAnchorBox } from './useAnchorBox'
import { provideAutofillVault } from './useAutofillVault'
import { fieldsOf, useHostPage } from './useHostPage'
import { useLockNotice } from './useLockNotice'
import { useTabRequests } from './useTabRequests'

/** The in-field button, in px. */
const TRIGGER_PX = 30
const TRIGGER_INSET_PX = 7
/** Upper bounds of the floats, for choosing a side and keeping them on screen. */
const PICKER_SIZE = { width: 340, height: 290 }
const GUARD_SIZE = { width: 348, height: 48 }
// The mockup's clearance between the Guard prompt and the code boxes.
const GUARD_GAP_PX = 38

/** The injected UI as a whole: what the page asks for, where the controls sit, and what a fill does. */
export function useAutofill(themed: Ref<Element | undefined>) {
    const host = useHostPage(themed)
    const vault = provideAutofillVault()
    const { filled, markFilled } = useFillFeedback()
    const viewport = useWindowSize()
    useTabRequests(host, vault)

    const pickerOpen = ref(false)
    // Each pick and each opening or closing of the picker moves it: a slower answer for an earlier pick is dropped.
    let pick = 0
    const guardDismissed = ref(false)

    const kind = computed(() => host.target.value?.kind)
    // Steam's sign-in swaps the form for the code prompt in place: the prompt asks the host who it is for.
    watch(host.target, (target) => {
        pickerOpen.value = false
        guardDismissed.value = false
        vault.cancel()
        if (target?.kind === 'guard') void vault.refresh()
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

    // The host names the account: the one last filled on this tab (even with no authenticator), else the first with one.
    const guardAccount = computed<PickerAccount | undefined>(() => {
        const named = vault.accounts.value.find(
            ({ id }) => id === vault.guardFor.value,
        )
        // An `everything` lock hides the flag too: a locked account gets its notice, never a code.
        return named?.guard || named?.locked ? named : undefined
    })
    const { notice: guardNotice, openApp: openGuardNotice } = useLockNotice(
        guardAccount,
        vault,
    )

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
            pick += 1
            pickerOpen.value = !pickerOpen.value
            if (pickerOpen.value) void vault.refresh()
            else vault.cancel()
        },
        closePicker: () => {
            pick += 1
            pickerOpen.value = false
            vault.cancel()
        },
        guardAccount,
        guardNotice,
        openGuardNotice,
        filled,
        dismissGuard: () => {
            guardDismissed.value = true
        },
        async fillAccount(account: PickerAccount) {
            pickerOpen.value = false
            const target = host.target.value
            const mine = ++pick
            const answer = await vault.login(
                account.id,
                () => pick === mine && host.target.value === target,
            )
            if (!answer) return
            // Refused: the host's list was read again, and the picker comes back with the notice.
            if ('refused' in answer) pickerOpen.value = true
            else host.fillLogin(answer.login, answer.password)
        },
        async fillCode() {
            const account = guardAccount.value
            if (!account) return
            const target = host.target.value
            const answer = await vault.code(
                account.id,
                () => host.target.value === target,
            )
            if (!answer || 'refused' in answer) return
            host.fillCode(answer.code)
            markFilled()
        },
    }
}
