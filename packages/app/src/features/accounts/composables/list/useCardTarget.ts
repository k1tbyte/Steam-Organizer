import { computed, onScopeDispose, type Ref, shallowRef, watch } from 'vue'

import { useScrollRoot, useScrollTop } from '#core'

import { useVaultAccounts } from '../useVaultAccounts'

export const CARD = '[data-account-id]'

/** An overlay hung on one list card. It keeps the account id, never the node (a recycled node shows another account),
 *  and closes once that account leaves the vault, the list scrolls or the node goes to another account. */
export function useCardTarget(open: Ref<boolean>) {
    const { accounts } = useVaultAccounts()
    const id = shallowRef<string>()
    const card = shallowRef<HTMLElement>()
    // Untouched until a press: the vault's list is not walked for an overlay nobody opened.
    const account = computed(() =>
        id.value === undefined
            ? undefined
            : accounts.value.find((found) => found.id === id.value),
    )
    watch(account, (found) => {
        if (!found) open.value = false
    })
    // The overlay stays where it opened: once the list moves, it points at nothing.
    watch(useScrollTop(), () => {
        open.value = false
    })
    const shown = () => {
        const node = card.value
        return node?.isConnected && node.dataset.accountId === id.value
            ? node
            : undefined
    }
    // A node dropped or handed to another account without a scroll (a resize, a filter) leaves the overlay on nothing.
    const moved = new MutationObserver(() => {
        if (!shown()) open.value = false
    })
    watch([open, useScrollRoot()], ([opened, root]) => {
        moved.disconnect()
        if (opened && root)
            moved.observe(root, {
                subtree: true,
                childList: true,
                attributeFilter: ['data-account-id'],
            })
    })
    onScopeDispose(() => moved.disconnect())

    return {
        account,
        /** The card while it still shows the account. */
        card: shown,
        /** Points at the card holding `el`; false off a card. */
        target(el: EventTarget | null): boolean {
            const node =
                el instanceof Element ? el.closest<HTMLElement>(CARD) : null
            if (!node) return false
            card.value = node
            id.value = node.dataset.accountId
            return true
        },
    }
}
