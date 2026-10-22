import { computed, onScopeDispose, shallowReactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import { useSettingsEntry } from '#features/settings'
import { useVaultSession } from '#features/vault'

import type { ShellNavItem } from '../model'

// The page each section was left on, while the shell lives.
const left = shallowReactive(new Map<string, string>())

/** Records where each section is left; the shell calls it once, and a lock, which unmounts the shell, clears it. */
export function useSectionMemory() {
    const route = useRoute()
    // The path alone: every query key is an overlay (settings, a dialog, reorder), which a section must not reopen.
    watch(
        () => route.path,
        (path) => {
            if (route.meta.nav) left.set(route.meta.nav, path)
        },
        { immediate: true },
    )
    onScopeDispose(() => left.clear())
}

/** Rail and tab bar entries; pages mark theirs with `meta.nav`. */
export function useShellNav() {
    const { t } = useI18n()
    const route = useRoute()
    const settings = useSettingsEntry()

    // An entry reopens its section where it was left; pressed inside its section, it goes to the section's root.
    const entry = (key: string, root: string) =>
        route.meta.nav === key ? root : (left.get(key) ?? root)

    const main = computed<ShellNavItem[]>(() => [
        {
            key: 'accounts',
            label: t('Accounts'),
            icon: 'icon-[lucide--users]',
            to: entry('accounts', '/'),
        },
        {
            key: 'backups',
            label: t('Backups'),
            icon: 'icon-[lucide--cloud]',
            to: entry('backups', '/backups'),
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
