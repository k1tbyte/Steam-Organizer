import { computed, shallowRef } from 'vue'

import {
    isPaletteKeyIgnored,
    type PickerAccount,
    useAccountPicker,
} from '#features/quick-access'

import { useAutofillVault } from './useAutofillVault'
import { useLockNotice } from './useLockNotice'

interface PickerActions {
    fill: (account: PickerAccount) => void
    close: () => void
}

/** The injected picker: the shared account palette over the host's list, plus the notice a locked vault or account
 *  swaps in. */
export function useLoginPicker({ fill, close }: PickerActions) {
    const vault = useAutofillVault()
    const picker = useAccountPicker(vault.accounts)
    // The locked account that was picked: its notice shows until the user backs out.
    const blocked = shallowRef<PickerAccount>()
    const { notice, openApp } = useLockNotice(blocked, vault)

    function choose(account: PickerAccount) {
        if (account.locked) blocked.value = account
        else fill(account)
    }

    function onKeydown(event: KeyboardEvent) {
        if (isPaletteKeyIgnored(event)) return
        const { key } = event
        if (key === 'Escape') {
            event.preventDefault()
            if (blocked.value) blocked.value = undefined
            else close()
        } else if (notice.value) {
            return
        } else if (key === 'ArrowDown' || key === 'ArrowUp') {
            event.preventDefault()
            picker.move(key === 'ArrowDown' ? 1 : -1)
        } else if (key === 'Enter' && picker.selected.value) {
            event.preventDefault()
            choose(picker.selected.value)
        }
    }

    return {
        query: picker.query,
        rows: picker.rows,
        index: picker.index,
        activeId: picker.activeId,
        revealed: picker.revealed,
        hasAccounts: picker.hasAccounts,
        // Held back until the host has answered once: no flash of an empty list or a wrong notice.
        loaded: computed(() => vault.state.value !== undefined),
        select: picker.select,
        choose,
        notice,
        openApp,
        onKeydown,
    }
}
