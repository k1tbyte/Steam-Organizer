import { shallowRef } from 'vue'

import { useCardTarget } from './useCardTarget'

/** The list's one tag picker, hung from the pressed control of a card (or the card, from its menu). */
export function useCardTagPicker() {
    const open = shallowRef(false)
    const target = useCardTarget(open)
    const anchor = shallowRef<HTMLElement>()
    return {
        open,
        anchor,
        account: target.account,
        show(el: HTMLElement) {
            if (!target.target(el)) return
            anchor.value = el
            open.value = true
        },
    }
}
