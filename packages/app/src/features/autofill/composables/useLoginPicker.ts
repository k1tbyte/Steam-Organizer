import { shallowRef } from 'vue'

import type { Account } from '#features/accounts'
import { isPaletteKeyIgnored, useAccountPicker } from '#features/quick-access'

import { useLockNotice } from './useLockNotice'

interface PickerActions {
    fill: (account: Account) => void
    close: () => void
}

/** The injected picker: the shared account palette, plus the notice a locked vault or account swaps in. */
export function useLoginPicker({ fill, close }: PickerActions) {
    const picker = useAccountPicker()
    // The locked account that was picked: its notice shows until the user backs out.
    const blocked = shallowRef<Account>()
    const { notice, openApp } = useLockNotice(blocked)

    function choose(account: Account) {
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
        select: picker.select,
        choose,
        notice,
        openApp,
        onKeydown,
    }
}
