import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { TAG_HUES } from '../../services/tags'

type TagHue = (typeof TAG_HUES)[number]

/** The swatches a tag's color is picked from, named for screen readers. */
export function useTagColors() {
    const { t } = useI18n()
    const names = computed<Record<TagHue, string>>(() => ({
        265: t('Blue'),
        205: t('Cyan'),
        150: t('Green'),
        95: t('Olive'),
        45: t('Orange'),
        25: t('Red'),
        330: t('Pink'),
    }))
    return computed(() =>
        TAG_HUES.map((hue) => ({ hue, name: names.value[hue] })),
    )
}
