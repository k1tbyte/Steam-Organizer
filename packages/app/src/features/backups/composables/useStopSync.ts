import { useToast } from '@so/ui'
import { computed, ref, type UnwrapNestedRefs } from 'vue'
import { useI18n } from 'vue-i18n'

import { reportError } from '#core'
import { useVaultSession } from '#features/vault'

import { useVaultSync } from '../stores/useVaultSync'

/** Stop syncing the open vault, after a confirm: it becomes a vault of this device (`useVaultSync().stop`). */
export function useStopSync() {
    const { t } = useI18n()
    const session = useVaultSession()
    const engine = useVaultSync()
    const toast = useToast()
    const open = ref(false)
    const pending = ref(false)
    const error = ref<string | null>(null)
    // Kept while the confirm animates out.
    const name = ref('')

    async function confirm() {
        if (!session.vault?.sync || pending.value) return
        pending.value = true
        error.value = null
        try {
            await engine.stop()
            open.value = false
            toast.add({
                color: 'success',
                title: t('{name} no longer syncs', { name: name.value }),
                description: t('It stays on this device.'),
            })
        } catch (failure) {
            reportError(failure, 'sync')
            error.value = t(
                "Couldn't save on this device; the vault still syncs.",
            )
        } finally {
            pending.value = false
        }
    }

    return {
        /** The open vault syncs with Google Drive. */
        synced: computed(() => !!session.vault?.sync),
        open,
        pending,
        error,
        title: computed(() => t('Stop syncing {name}?', { name: name.value })),
        ask() {
            name.value = session.vault?.name ?? ''
            error.value = null
            open.value = true
        },
        confirm,
    }
}

export type StopSync = UnwrapNestedRefs<ReturnType<typeof useStopSync>>
