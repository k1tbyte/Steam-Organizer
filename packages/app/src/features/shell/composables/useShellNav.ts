import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import { useSettingsEntry } from '#features/settings'
import { useVaultSession } from '#features/vault'

import type { ShellNavItem } from '../model'

/** Rail and tab bar entries; pages mark theirs with `meta.nav`. */
export function useShellNav() {
    const { t } = useI18n()
    const route = useRoute()
    const settings = useSettingsEntry()

    const main = computed<ShellNavItem[]>(() => [
        {
            key: 'accounts',
            label: t('Accounts'),
            icon: 'icon-[lucide--users]',
            to: '/',
        },
        {
            key: 'backups',
            label: t('Backups'),
            icon: 'icon-[lucide--cloud]',
            to: '/backups',
        },
        {
            key: 'bots',
            label: t('Bots'),
            icon: 'icon-[lucide--bot]',
            soon: true,
        },
    ])
    const settingsItem = computed<ShellNavItem>(() => ({
        key: 'settings',
        label: t('Settings'),
        icon: 'icon-[lucide--settings]',
    }))

    const activeKey = computed(() =>
        settings.active.value ? 'settings' : route.meta.nav,
    )
    const showTabBar = computed(() => route.meta.tabBar !== false)

    // The rail and the tab bar each glide one highlight to the active entry's slot.
    const tabs = computed(() => [...main.value, settingsItem.value])
    const tabIndex = computed(() =>
        tabs.value.findIndex((item) => item.key === activeKey.value),
    )
    const railIndex = computed(() =>
        main.value.findIndex((item) => item.key === activeKey.value),
    )

    function press(item: ShellNavItem) {
        if (item.key === settingsItem.value.key) settings.open()
    }

    return {
        main,
        settingsItem,
        activeKey,
        tabs,
        tabIndex,
        railIndex,
        showTabBar,
        openSettings: settings.open,
        press,
        lock: useVaultSession().lock,
    }
}
