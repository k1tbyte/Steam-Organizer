import { type MenuGroup, useToast } from '@so/ui'
import { shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { copyText, usePageActive } from '#core'
import { useGuardCodes } from '#features/steam-guard'

import type { Account } from '../../model'
import { useAccountPassword } from '../useAccountPassword'
import { CARD, useCardTarget } from './useCardTarget'

export interface AccountIntents {
    togglePin: (id: string) => void
    /** Gets the card node, which the tag picker hangs from. */
    editTags: (card: HTMLElement) => void
    delete: (id: string) => void
}

/** The list's one context menu: which account was pressed, its actions, and where focus goes when it closes. */
export function useAccountMenu(intents: AccountIntents) {
    const { t } = useI18n()
    const router = useRouter()
    const toast = useToast()
    const passwordOf = useAccountPassword()
    const codeOf = useGuardCodes()
    const active = usePageActive()

    const open = shallowRef(false)
    const target = useCardTarget(open)
    let opener: Element | null = null

    async function copy(text: string | Promise<string>, done: string) {
        if (await copyText(text)) toast.add({ title: done, color: 'success' })
    }
    // Acts on the account as the vault holds it now.
    const act = (run: (account: Account) => void) => () => {
        if (target.account.value) run(target.account.value)
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
                                              codeOf(id),
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
                        opens: true,
                        onSelect: act(() => {
                            const card = target.card()
                            if (card) intents.editTags(card)
                        }),
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

    // The menu keeps its last items while it fades out.
    const items = shallowRef<MenuGroup[]>([])
    watch(target.account, (account) => {
        if (account) items.value = groupsFor(account)
    })

    return {
        open,
        items,
        accept(event: MouseEvent) {
            if (!target.target(event.target)) return false
            opener = document.activeElement
            return true
        },
        // Reka hands focus back to what had it: only while that still sits in this account's card on the current page.
        closeAutoFocus(event: Event) {
            const card = opener?.closest<HTMLElement>(CARD)
            if (
                !active.value ||
                !opener?.isConnected ||
                card?.dataset.accountId !== target.account.value?.id
            )
                event.preventDefault()
        },
    }
}
