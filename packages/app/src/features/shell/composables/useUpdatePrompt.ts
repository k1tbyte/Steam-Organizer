import { useToast } from '@so/ui'
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { useAppUpdate, useAppUpdateWatch } from '#core'

// Once per version per page: an unlock mounts the shell again, never the page.
const toasted = new Set<string | null>()

/** Watches for a new build (web only) and toasts it once with Reload. The shell calls it once. */
export function useUpdatePrompt() {
    useAppUpdateWatch()
    const { t } = useI18n()
    const toast = useToast()
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
}
