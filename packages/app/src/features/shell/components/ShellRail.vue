<script setup lang="ts">
import { FpIcon } from '@so/ui'
import logoUrl from '@so/ui/logo.svg'
import { useI18n } from 'vue-i18n'

import { useShellNav } from '../composables/useShellNav'
import type { ShellNavItem } from '../model'
import ShellNavLink from './ShellNavLink.vue'

const { t } = useI18n()
const { main, settingsItem, activeKey, openSettings, lock } = useShellNav()

function title(item: ShellNavItem) {
    return item.soon ? t('{name} (soon)', { name: item.label }) : item.label
}

function look(item: ShellNavItem) {
    if (item.soon) return 'cursor-default text-fg-faint'
    if (item.key === activeKey.value) return 'bg-accent-soft text-accent-ink'
    return 'cursor-pointer text-fg-3 hover:bg-hover hover:text-fg-1'
}
</script>

<template>
    <aside
        class="layer-chrome flex w-16 shrink-0 flex-col items-center gap-1.5 border-r border-stroke-1 bg-canvas-elev py-4 backdrop-surface">
        <img :src="logoUrl" alt="" class="mb-3.5 size-7" />
        <ShellNavLink
            v-for="item in main"
            :key="item.key"
            :to="item.to"
            :disabled="item.soon"
            :title="title(item)"
            :aria-label="item.label"
            :aria-current="item.key === activeKey ? 'page' : undefined"
            class="grid size-10 place-items-center rounded text-19 transition-colors duration-fast"
            :class="look(item)">
            <FpIcon :name="item.icon" />
        </ShellNavLink>
        <span class="flex-1" />
        <ShellNavLink
            :title="t('Lock vault')"
            :aria-label="t('Lock vault')"
            class="grid size-10 cursor-pointer place-items-center rounded text-18 text-fg-3 transition-colors duration-fast hover:bg-hover hover:text-fg-1"
            @click="lock">
            <FpIcon name="icon-[lucide--lock]" />
        </ShellNavLink>
        <ShellNavLink
            :title="settingsItem.label"
            :aria-label="settingsItem.label"
            :aria-pressed="settingsItem.key === activeKey"
            class="grid size-10 place-items-center rounded text-18 transition-colors duration-fast"
            :class="look(settingsItem)"
            @click="openSettings">
            <FpIcon :name="settingsItem.icon" />
        </ShellNavLink>
    </aside>
</template>
