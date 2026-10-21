<script setup lang="ts">
import { FpIcon, FpTooltip } from '@so/ui'
import logoUrl from '@so/ui/logo.svg'
import { useI18n } from 'vue-i18n'

import { useShellNav } from '../composables/useShellNav'
import type { ShellNavItem } from '../model'
import ShellNavLink from './ShellNavLink.vue'

const { t } = useI18n()
const { main, settingsItem, activeKey, railIndex, openSettings, lock } = useShellNav()

function title(item: ShellNavItem) {
    return item.soon ? t('{name} (soon)', { name: item.label }) : item.label
}

// The main entries share the gliding highlight; Settings sits at the bottom and keeps its own fill.
function look(item: ShellNavItem, ownFill = false) {
    if (item.soon) return 'cursor-default text-fg-faint'
    if (item.key === activeKey.value) return ownFill ? 'bg-accent-soft text-accent-ink' : 'text-accent-ink'
    return 'cursor-pointer text-fg-3 hover:bg-hover hover:text-fg-1'
}
</script>

<template>
    <aside
        class="layer-chrome flex w-16 shrink-0 flex-col items-center gap-1.5 border-r border-stroke-1 bg-canvas-elev py-4 backdrop-surface">
        <img :src="logoUrl" alt="" class="mb-3.5 size-7" />
        <div class="relative flex flex-col gap-1.5">
            <span v-if="railIndex >= 0" class="rail-glider absolute top-0 left-0 size-10 rounded bg-accent-soft" :style="{ '--i': railIndex }" aria-hidden="true" />
            <FpTooltip v-for="item in main" :key="item.key" :text="title(item)" placement="right">
                <ShellNavLink
                    :to="item.to"
                    :disabled="item.soon"
                    :aria-label="item.label"
                    :aria-current="item.key === activeKey ? 'page' : undefined"
                    class="relative grid size-10 place-items-center rounded text-19 transition-colors duration-fast"
                    :class="look(item)">
                    <FpIcon :name="item.icon" />
                </ShellNavLink>
            </FpTooltip>
        </div>
        <span class="flex-1" />
        <FpTooltip :text="t('Lock vault')" label placement="right">
            <ShellNavLink
                class="grid size-10 cursor-pointer place-items-center rounded text-18 text-fg-3 transition-colors duration-fast hover:bg-hover hover:text-fg-1"
                @click="lock">
                <FpIcon name="icon-[lucide--lock]" />
            </ShellNavLink>
        </FpTooltip>
        <FpTooltip :text="settingsItem.label" label placement="right">
            <ShellNavLink
                :aria-pressed="settingsItem.key === activeKey"
                class="grid size-10 place-items-center rounded text-18 transition-colors duration-fast"
                :class="look(settingsItem, true)"
                @click="openSettings()">
                <FpIcon :name="settingsItem.icon" />
            </ShellNavLink>
        </FpTooltip>
    </aside>
</template>

<style scoped>
/* One 40px slot plus the 6px gap per step. */
.rail-glider {
    translate: 0 calc(var(--i) * (100% + 0.375rem));
    transition: translate var(--dur-slow) var(--ease-move);
}
</style>
