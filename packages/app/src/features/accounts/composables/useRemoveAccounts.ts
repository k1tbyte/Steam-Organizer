import { useToast } from '@so/ui'
import { computed, ref, shallowRef, type UnwrapNestedRefs } from 'vue'
import { useI18n } from 'vue-i18n'

import { reportError, toSteamId64 } from '#core'
import { useVaultSession } from '#features/vault'

import type { Account } from '../model'
import { steamNameOf } from '../services/accountName'
import { useVaultAccounts } from './useVaultAccounts'

const UNDO_MS = 8000
// The dialog names this many; the rest is a count.
const LISTED = 4

/** Deleting accounts: the card's trash removes at once, a menu or the edit bar asks first; either way a toast offers Undo. */
export function useRemoveAccounts() {
    const { t } = useI18n()
    const toast = useToast()
    const vault = useVaultAccounts()
    const session = useVaultSession()
    // A lock clears the toasts; a write that lands after it must not bring one back.
    const unlocked = () => session.state === 'unlocked'
    const open = ref(false)
    // Kept after closing, so the dialog fades out with its rows.
    const asked = shallowRef<readonly Account[]>([])
    const single = computed(() => asked.value.length === 1)

    function picked(ids: readonly string[]) {
        const wanted = new Set(ids)
        return vault.accounts.value.filter(({ id }) => wanted.has(id))
    }

    async function restore(
        undo: () => Promise<void>,
        name: string | null,
        count: number,
    ) {
        try {
            await undo()
        } catch (error) {
            reportError(error, 'accounts')
            toast.add({ color: 'danger', title: t("Couldn't restore") })
            return
        }
        if (!unlocked()) return
        toast.add({
            color: 'success',
            icon: 'icon-[lucide--undo-2]',
            title: name
                ? t('{name} is back', { name })
                : t('{count} accounts are back', { count }),
            description: name
                ? t('Restored with its tags, notes and secrets.')
                : t('Restored with their tags, notes and secrets.'),
        })
    }

    async function remove(gone: readonly Account[]) {
        if (gone.length === 0) return
        const name = gone.length === 1 ? (gone[0]?.nickname ?? null) : null
        const count = gone.length
        let undo: () => Promise<void>
        try {
            undo = await vault.remove(gone.map(({ id }) => id))
        } catch (error) {
            reportError(error, 'accounts')
            toast.add({ color: 'danger', title: t("Couldn't remove") })
            return
        }
        if (!unlocked()) return
        toast.add({
            title: name
                ? t('{name} removed', { name })
                : t('{count} accounts removed', { count }),
            description: (seconds) => t('Undo for {seconds} s', { seconds }),
            icon: 'icon-[lucide--trash-2]',
            duration: UNDO_MS,
            progress: true,
            action: {
                label: t('Undo'),
                onClick: () => void restore(undo, name, count),
            },
        })
    }

    return {
        open,
        single,
        title: computed(() =>
            single.value
                ? t('Remove account?')
                : t('Remove {count} accounts?', { count: asked.value.length }),
        ),
        note: computed(() =>
            single.value
                ? t(
                      'It leaves this vault on every synced device. Backups made before now still have it.',
                  )
                : t(
                      'They leave this vault on every synced device. Backups made before now still have them.',
                  ),
        ),
        confirmLabel: computed(() =>
            single.value
                ? t('Remove account')
                : t('Remove {count}', { count: asked.value.length }),
        ),
        rows: computed(() =>
            asked.value.slice(0, LISTED).map((account) => {
                const steamName = steamNameOf(account)
                const steamId = account.steamId && toSteamId64(account.steamId)
                return {
                    ...account,
                    steamName,
                    /** One account shows its Steam nickname and SteamID64 under the name. */
                    detail: [steamName, steamId].filter(Boolean).join(' · '),
                }
            }),
        ),
        more: computed(() => Math.max(0, asked.value.length - LISTED)),
        /** Opens the confirm for these accounts. */
        ask(ids: readonly string[]) {
            asked.value = picked(ids)
            if (asked.value.length > 0) open.value = true
        },
        confirm() {
            open.value = false
            void remove(asked.value)
        },
        /** Removes without asking: Undo is the safety net. */
        removeNow(ids: readonly string[]) {
            void remove(picked(ids))
        },
    }
}

export type RemoveAccountsState = UnwrapNestedRefs<
    ReturnType<typeof useRemoveAccounts>
>
