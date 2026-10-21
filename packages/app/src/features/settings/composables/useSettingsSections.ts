import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { GroupKey, SettingsGroup, SettingsSection } from '../model'
import { GROUP_KEYS, SECTION_DEFS } from '../registry'

/** The sections with their copy, grouped for the nav and the phone index. */
export function useSettingsSections() {
    const { t } = useI18n()

    const groupTitles = computed<Record<GroupKey, string>>(() => ({
        app: t('App'),
        vault: t('Vault'),
        steam: t('Steam'),
    }))

    const sections = computed<SettingsSection[]>(() =>
        SECTION_DEFS.map(({ title, description, soon, ...rest }) => ({
            ...rest,
            title: t(title),
            description: t(description),
            soon: soon === true,
        })),
    )

    const groups = computed<SettingsGroup[]>(() =>
        GROUP_KEYS.map((key) => ({
            key,
            title: groupTitles.value[key],
            sections: sections.value.filter((section) => section.group === key),
        })),
    )

    function find(key: string): SettingsSection | undefined {
        return sections.value.find((section) => section.key === key)
    }

    /** Place in nav order, so a section switch moves the way the nav reads. */
    function position(key: string): number {
        return groups.value
            .flatMap((group) => group.sections)
            .findIndex((section) => section.key === key)
    }

    return { groups, find, position }
}
