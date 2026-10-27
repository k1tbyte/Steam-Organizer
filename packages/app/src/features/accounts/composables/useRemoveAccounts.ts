import { toSteamId64 } from '@so/core'
import { computed, ref, shallowRef, type UnwrapNestedRefs } from 'vue'
import { useI18n } from 'vue-i18n'

import { useUndoDelete } from '#features/vault'

import type { Account } from '../model'
import { steamNameOf } from '../services/accountName'
import { useVaultAccounts } from './useVaultAccounts'

// The dialog names this many; the rest is a count.
const LISTED = 4

/** Deleting accounts: the card's trash removes at once, a menu or the edit bar asks first; either way a toast offers Undo. */
export function useRemoveAccounts() {
    const { t } = useI18n()
    const vault = useVaultAccounts()
    const undoDelete = useUndoDelete()
    const open = ref(false)
    // Kept after closing, so the dialog fades out with its rows.
    const asked = shallowRef<readonly Account[]>([])
    const single = computed(() => asked.value.length === 1)

    function picked(ids: readonly string[]) {
        const wanted = new Set(ids)
        return vault.accounts.value.filter(({ id }) => wanted.has(id))
    }

    function remove(gone: readonly Account[]) {
        if (gone.length === 0) return
        const name = gone.length === 1 ? (gone[0]?.nickname ?? null) : null
        const count = gone.length
        return undoDelete({
            remove: () => vault.remove(gone.map(({ id }) => id)),
            title: name
                ? t('{name} removed', { name })
                : t('{count} accounts removed', { count }),
            failed: t("Couldn't remove"),
            restored: {
                title: name
                    ? t('{name} is back', { name })
                    : t('{count} accounts are back', { count }),
                description: name
                    ? t('Restored with its tags, notes and secrets.')
                    : t('Restored with their tags, notes and secrets.'),
            },
            scope: 'accounts',
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
