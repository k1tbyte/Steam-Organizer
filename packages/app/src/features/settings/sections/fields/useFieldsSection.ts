import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { FieldKey, FieldMode, FieldModes } from '../../model'
import {
    FIELD_KEYS,
    isFixedSecret,
    isSecret,
    secretCount,
} from '../../services/fieldSecrecy'
import { useSettingsStore } from '../../stores/settingsStore'

const ICONS: Record<FieldKey, string> = {
    nickname: 'icon-[lucide--user-round]',
    login: 'icon-[lucide--at-sign]',
    note: 'icon-[lucide--sticky-note]',
    phone: 'icon-[lucide--phone]',
    email: 'icon-[lucide--mail]',
    password: 'icon-[lucide--key-round]',
    linked: 'icon-[lucide--link]',
    auth: 'icon-[lucide--shield-check]',
}

export function useFieldsSection() {
    const { t } = useI18n()
    const store = useSettingsStore()

    const labels = computed<Record<FieldKey, string>>(() => ({
        nickname: t('Nickname'),
        login: t('Login'),
        note: t('Note'),
        phone: t('Phone'),
        email: t('Email'),
        password: t('Password'),
        linked: t('Linked services'),
        auth: t('Steam Guard'),
    }))

    const modeItems = computed(() => [
        {
            value: 'searchable' as const,
            label: t('Searchable'),
            icon: 'icon-[lucide--search]',
        },
        {
            value: 'secret' as const,
            label: t('Secret'),
            icon: 'icon-[lucide--lock-keyhole]',
        },
    ])

    const rows = computed(() =>
        FIELD_KEYS.map((key) => ({
            key,
            label: labels.value[key],
            icon: ICONS[key],
            fixed: isFixedSecret(key),
            mode: (isSecret(key, store.fieldModes)
                ? 'secret'
                : 'searchable') as FieldMode,
        })),
    )

    const summary = computed(() => {
        const secret = secretCount(FIELD_KEYS, store.fieldModes)
        return t('{searchable} searchable · {secret} secret', {
            searchable: FIELD_KEYS.length - secret,
            secret,
        })
    })

    function setMode(key: FieldKey, mode: FieldMode) {
        store.setFieldMode(key as keyof FieldModes, mode)
    }

    return { rows, modeItems, summary, setMode }
}
