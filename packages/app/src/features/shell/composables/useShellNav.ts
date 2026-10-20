import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import { useSettingsEntry } from '#features/settings'

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

    function press(item: ShellNavItem) {
        if (item.key === settingsItem.value.key) settings.open()
    }

    function lock() {
        // The vault feature wires locking; the rail only states the intent.
    }

    return {
        main,
        settingsItem,
        activeKey,
        showTabBar,
        openSettings: settings.open,
        press,
        lock,
    }
}
