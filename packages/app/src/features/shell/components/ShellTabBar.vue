<script setup lang="ts">
import { FpIcon } from '@so/ui'
import { computed } from 'vue'

import { useShellNav } from '../composables/useShellNav'
import type { ShellNavItem } from '../model'
import ShellNavLink from './ShellNavLink.vue'

const { main, settingsItem, activeKey, press } = useShellNav()
const items = computed(() => [...main.value, settingsItem.value])

function labelLook(item: ShellNavItem) {
    if (item.soon) return 'font-medium text-fg-faint'
    if (item.key === activeKey.value) return 'font-semibold text-fg-1'
    return 'font-medium text-fg-3'
}
</script>

<template>
    <nav
        class="safe-pb shrink-0 border-t border-stroke-1 bg-canvas-elev backdrop-surface">
        <div class="grid grid-cols-4 px-2 pt-1.5">
            <ShellNavLink
                v-for="item in items"
                :key="item.key"
                :to="item.to"
                :disabled="item.soon"
                :aria-current="item.key === activeKey ? 'page' : undefined"
                class="flex flex-col items-center gap-0.75 py-1 text-10"
                :class="labelLook(item)"
                @click="press(item)">
                <span
                    class="grid h-7.5 w-14 place-items-center rounded-full text-18 transition-colors duration-fast"
                    :class="item.key === activeKey && 'bg-accent-soft text-accent-ink'">
                    <FpIcon :name="item.icon" />
                </span>
                {{ item.label }}
            </ShellNavLink>
        </div>
    </nav>
</template>
