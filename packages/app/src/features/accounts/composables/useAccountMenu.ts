import { type MenuGroup, useToast } from '@so/ui'
import { computed, onScopeDispose, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { copyText, usePageActive, useScrollTop } from '#core'
import { guardCodeAt } from '#features/steam-guard'

import type { Account } from '../model'
import { useAccountPassword } from './useAccountPassword'
import { useVaultAccounts } from './useVaultAccounts'

export interface AccountIntents {
    togglePin: (id: string) => void
    editTags: (id: string) => void
    delete: (id: string) => void
}

const CARD = '[data-account-id]'

/** The list's one context menu: which account was pressed, its actions, and where focus goes when it closes. */
export function useAccountMenu(intents: AccountIntents) {
    const { t } = useI18n()
    const router = useRouter()
    const toast = useToast()
    const passwordOf = useAccountPassword()
    const { accounts } = useVaultAccounts()
    const active = usePageActive()

    const open = shallowRef(false)
    // An id, never a node: a recycled card node shows another account.
    const targetId = shallowRef<string>()
    let opener: Element | null = null
    // Untouched until a press: the vault's list is not walked for a menu nobody opened.
    const target = computed(() =>
        targetId.value === undefined
            ? undefined
            : accounts.value.find((account) => account.id === targetId.value),
    )

    async function copy(text: string, done: string) {
        if (await copyText(text)) toast.add({ title: done, color: 'success' })
    }
    // Acts on the account as the vault holds it now.
    const act = (run: (account: Account) => void) => () => {
        if (target.value) run(target.value)
    }

    function groupsFor({ guard, locked, pinned }: Account): MenuGroup[] {
        return [
            {
                items: [
                    {
                        label: t('Open profile'),
                        icon: 'icon-[lucide--user-round]',
                        onSelect: act(
                            ({ id }) => void router.push(`/accounts/${id}`),
                        ),
                    },
                    {
                        label: t('Copy login'),
                        icon: 'icon-[lucide--at-sign]',
                        disabled: locked,
                        onSelect: act(
                            ({ login }) => void copy(login, t('Login copied')),
                        ),
                    },
                    {
                        label: t('Copy password'),
                        icon: 'icon-[lucide--key-round]',
                        disabled: locked,
                        onSelect: act(
                            (account) =>
                                void copy(
                                    passwordOf(account),
                                    t('Password copied'),
                                ),
                        ),
                    },
                    ...(guard
                        ? [
                              {
                                  label: t('Copy Steam Guard code'),
                                  icon: 'icon-[lucide--shield-check]',
                                  disabled: locked,
                                  onSelect: act(
                                      ({ id }) =>
                                          void copy(
                                              guardCodeAt(id),
                                              t('Steam Guard code copied'),
                                          ),
                                  ),
                              },
                          ]
                        : []),
                ],
            },
            {
                items: [
                    {
                        label: pinned ? t('Unpin') : t('Pin to top'),
                        icon: pinned
                            ? 'icon-[lucide--pin-off]'
                            : 'icon-[lucide--pin]',
                        onSelect: act(({ id }) => intents.togglePin(id)),
                    },
                    {
                        label: t('Edit tags'),
                        icon: 'icon-[lucide--tag]',
                        onSelect: act(({ id }) => intents.editTags(id)),
                    },
                ],
            },
            {
                items: [
                    {
                        label: t('Delete'),
                        icon: 'icon-[lucide--trash-2]',
                        color: 'danger',
                        onSelect: act(({ id }) => intents.delete(id)),
                    },
                ],
            },
        ]
    }

    // An account that left the vault closes its menu, which keeps its last items while it fades out.
    const items = shallowRef<MenuGroup[]>([])
    watch(target, (account) => {
        if (account) items.value = groupsFor(account)
        else open.value = false
    })
    // The menu stays where it opened: once the list moves, it points at nothing.
    watch(useScrollTop(), () => {
        open.value = false
    })
    // A card node handed to another account without a scroll (a resize, a filter) leaves the menu on the wrong card.
    const pressed = shallowRef<HTMLElement>()
    const recycled = new MutationObserver(() => {
        if (pressed.value?.dataset.accountId !== targetId.value)
            open.value = false
    })
    watch([open, pressed], ([shown, card]) => {
        recycled.disconnect()
        if (shown && card)
            recycled.observe(card, { attributeFilter: ['data-account-id'] })
    })
    onScopeDispose(() => recycled.disconnect())

    return {
        open,
        items,
        accept(event: MouseEvent) {
            const card =
                event.target instanceof Element
                    ? event.target.closest<HTMLElement>(CARD)
                    : null
            if (!card) return false
            pressed.value = card
            targetId.value = card.dataset.accountId
            opener = document.activeElement
            return true
        },
        // Reka hands focus back to what had it: only while that still sits in this account's card on the current page.
        closeAutoFocus(event: Event) {
            const card = opener?.closest<HTMLElement>(CARD)
            if (
                !active.value ||
                !opener?.isConnected ||
                card?.dataset.accountId !== targetId.value
            )
                event.preventDefault()
        },
    }
}
