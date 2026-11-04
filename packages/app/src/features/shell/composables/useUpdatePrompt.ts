import { useToast } from '@so/ui'
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { useAppUpdate, useAppUpdateWatch } from '#core'
import { useNotificationLog } from '#features/notifications'
import { useVaultSession } from '#features/vault'

// Once per version per page: an unlock mounts the shell again, never the page.
const toasted = new Set<string | null>()

/** Watches for a new build (web only): toasts it once with Reload, and logs it once in each vault opened while it
 *  waits. The shell calls it once. */
export function useUpdatePrompt() {
    useAppUpdateWatch()
    const { t } = useI18n()
    const toast = useToast()
    const session = useVaultSession()
    const notifications = useNotificationLog()
    const { update, apply } = useAppUpdate()

    watch(
        update,
        (found) => {
            if (!found || toasted.has(found.version)) return
            toasted.add(found.version)
            toast.add({
                title: t('Update available'),
                description: found.version
                    ? t('Reload to get {version}', { version: found.version })
                    : t('Reload to get the new version'),
                icon: 'icon-[lucide--download]',
                action: { label: t('Reload'), onClick: apply },
            })
        },
        { immediate: true },
    )

    // A build still waiting after a reload is found again: `once` keeps one entry for it.
    watch(
        () => [update.value, session.vault?.id] as const,
        ([found, vaultId]) => {
            if (found && vaultId)
                notifications.push(
                    vaultId,
                    { kind: 'update', version: found.version },
                    { once: true },
                )
        },
        { immediate: true },
    )
}
