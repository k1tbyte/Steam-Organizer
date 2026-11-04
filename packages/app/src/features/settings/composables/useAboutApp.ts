import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useAppUpdate } from '#core'

/** The running version and the nav footer's update link; a click reloads into the waiting build. */
export function useAboutApp() {
    const { t } = useI18n()
    const { version, update, apply } = useAppUpdate()
    return {
        version,
        updateLabel: computed(() => {
            if (!update.value) return null
            const next = update.value.version
            return next
                ? t('Update to {version}', { version: next })
                : t('Update')
        }),
        apply,
    }
}
