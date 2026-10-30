import { type Backup, DriveError, listBackups } from '@so/core'
import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'

import { reportError } from '#core'
import { useDrive } from '#features/drive'
import { useVaultSession } from '#features/vault'

interface Held<T> {
    at: string
    value: T
}

/** The open vault's backups on the connected Google account, shared by the Backups page and Settings.
 *  Kept with the scope it was read for: another vault or account never sees it. */
export const useBackupList = defineStore('backup-list', () => {
    const session = useVaultSession()
    const drive = useDrive()
    const held = shallowRef<Held<Backup[]> | null>(null)
    const failed = shallowRef<Held<DriveError> | null>(null)
    // Rows already sent to Drive's bin: a list read meanwhile still has them.
    const deleting = new Set<string>()
    // A list asked for before a newer request, a save or a delete never lands.
    let request = 0

    const scope = computed(() =>
        session.vault && drive.account.value
            ? `${session.vault.id} ${drive.account.value.email}`
            : null,
    )
    const current = <T>(entry: Held<T> | null) =>
        entry && entry.at === scope.value ? entry.value : undefined
    const list = computed(() => current(held.value))
    const failure = computed(() => current(failed.value) ?? null)

    async function load() {
        const at = scope.value
        const vaultId = session.vault?.id
        if (!at || !vaultId || drive.state.value === 'disconnected') return
        const attempt = ++request
        try {
            const found = await drive.run((api) => listBackups(api, vaultId))
            if (attempt !== request) return
            held.value = {
                at,
                value: found.filter(({ id }) => !deleting.has(id)),
            }
            failed.value = null
        } catch (error) {
            if (attempt !== request) return
            if (!(error instanceof DriveError)) reportError(error, 'backups')
            failed.value = {
                at,
                value:
                    error instanceof DriveError
                        ? error
                        : new DriveError('server'),
            }
        }
    }

    return {
        scope,
        list,
        failure,
        load,
        /** Puts a backup saved for `at` on top; without a good list, lists again. */
        added(at: string, saved: Backup) {
            if (scope.value !== at) return
            if (!list.value || failure.value) return void load()
            request++
            held.value = {
                at,
                value: [
                    saved,
                    ...list.value.filter(({ id }) => id !== saved.id),
                ],
            }
        },
        /** Drops the row at once and deletes it on Drive; a failure puts it back and throws. */
        async remove(id: string) {
            const at = scope.value
            const backup = list.value?.find((item) => item.id === id)
            if (!at || !backup) return
            request++
            deleting.add(id)
            held.value = {
                at,
                value: (list.value ?? []).filter((item) => item !== backup),
            }
            try {
                await drive.run((api) => api.remove(id))
            } catch (error) {
                if (error instanceof DriveError && error.kind === 'not-found')
                    return
                // Into the list it came from, even while another scope shows.
                if (held.value?.at === at)
                    held.value = {
                        at,
                        value: [...held.value.value, backup].sort(
                            (a, b) => b.createdAt - a.createdAt,
                        ),
                    }
                throw error
            } finally {
                deleting.delete(id)
                // A list read while the delete ran may still hold the row; with none held, list again.
                if (scope.value === at) {
                    request++
                    if (!list.value) void load()
                }
            }
        },
    }
})
