import type { ToggleOption } from '@so/ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { LockAfter } from '../model'

/** The nine lock timeouts, in the order the security section lists them. */
export function useLockAfterOptions() {
    const { t } = useI18n()

    const items = computed<ToggleOption<LockAfter>[]>(() => [
        { value: 'now', label: t('Immediately') },
        { value: '1m', label: t('1 minute') },
        { value: '5m', label: t('5 minutes') },
        { value: '15m', label: t('15 minutes') },
        { value: '30m', label: t('30 minutes') },
        { value: '1h', label: t('1 hour') },
        { value: '4h', label: t('4 hours') },
        { value: 'restart', label: t('On browser restart') },
        { value: 'never', label: t('Never') },
    ])

    function labelOf(value: LockAfter): string {
        return items.value.find((item) => item.value === value)?.label ?? ''
    }

    return { items, labelOf }
}
