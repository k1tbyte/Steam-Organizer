import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { BanKind } from '../model'

export function useBanLabels() {
    const { t } = useI18n()
    return computed<Record<BanKind, string>>(() => ({
        vac: t('VAC'),
        game: t('Game'),
        community: t('Community'),
        economy: t('Economy'),
    }))
}
