import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { SERVICE_KINDS, type ServiceKind } from '../../model'

const ICONS: Record<ServiceKind, string> = {
    email: 'icon-[lucide--mail]',
    faceit: 'icon-[simple-icons--faceit]',
    discord: 'icon-[simple-icons--discord]',
    other: 'icon-[lucide--globe]',
}

/** Linked service types: the editor's picker, and the icon and label a saved service shows. */
export function useServiceTypes() {
    const { t } = useI18n()
    const labels = computed<Record<ServiceKind, string>>(() => ({
        email: t('Email'),
        faceit: 'FACEIT',
        discord: 'Discord',
        other: t('Other'),
    }))
    const typeOf = (kind: ServiceKind) => ({
        kind,
        icon: ICONS[kind],
        label: labels.value[kind],
    })

    return {
        types: computed(() => SERVICE_KINDS.map(typeOf)),
        of: (kind: string) =>
            typeOf(
                SERVICE_KINDS.includes(kind as ServiceKind)
                    ? (kind as ServiceKind)
                    : 'other',
            ),
    }
}
