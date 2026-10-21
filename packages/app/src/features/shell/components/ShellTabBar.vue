<script setup lang="ts">
import { FpIcon } from '@so/ui'

import { useDock } from '../composables/useDock'
import { useShellNav } from '../composables/useShellNav'
import type { ShellNavItem } from '../model'
import ShellNavLink from './ShellNavLink.vue'

const { tabs, tabIndex, activeKey, press } = useShellNav()
const { hidden, reveal } = useDock()

function look(item: ShellNavItem) {
    if (item.soon) return 'text-fg-faint'
    return item.key === activeKey.value ? 'text-accent-ink' : 'text-fg-2'
}
</script>

<template>
    <nav
        class="shell-dock dock layer-dock surface-pop grid grid-cols-4 items-center gap-0.5 rounded-full px-1.5"
        :data-hidden="hidden || undefined"
        @focusin="reveal">
        <span v-if="tabIndex >= 0" class="dock-glider absolute rounded-full bg-accent-soft" :style="{ '--i': tabIndex }" aria-hidden="true" />
        <ShellNavLink
            v-for="item in tabs"
            :key="item.key"
            :to="item.to"
            :disabled="item.soon"
            :aria-current="item.key === activeKey ? 'page' : undefined"
            class="relative flex h-12 flex-col items-center justify-center gap-0.5 rounded-full text-10 font-semibold transition-colors duration-fast"
            :class="look(item)"
            @click="press(item)">
            <FpIcon :name="item.icon" class="text-17" />
            {{ item.label }}
        </ShellNavLink>
    </nav>
</template>

<!-- The shell raises phone toasts above the dock; the dock's clearance also pads the scroller (AppShell). -->
<style>
:root {
    --dock-h: 3.75rem;
    --dock-bottom: max(1.5rem, calc(var(--safe-bottom) + 0.5rem));
    --dock-clear: calc(var(--dock-bottom) + var(--dock-h) + 2.25rem);
}
:root:has(.shell-dock) {
    --toast-offset-bottom: calc(var(--dock-bottom) + var(--dock-h) + 0.75rem - var(--safe-bottom));
}
</style>

<style scoped>
.dock {
    position: fixed;
    left: max(1rem, var(--safe-left));
    right: max(1rem, var(--safe-right));
    bottom: var(--dock-bottom);
    height: var(--dock-h);
    box-shadow: var(--elev-float);
    transition: translate var(--dur-slow) var(--ease-move);
}
/* Past the bottom edge, shadow included. */
.dock[data-hidden] {
    translate: 0 calc(100% + var(--dock-bottom) + 2.5rem);
}
/* One slot of the 4-column track: 6px padding, 2px gaps. */
.dock-glider {
    top: 0.375rem;
    left: 0.375rem;
    height: 3rem;
    width: calc((100% - 1.125rem) / 4);
    translate: calc(var(--i) * (100% + 0.125rem)) 0;
    transition: translate var(--dur-slow) var(--ease-move);
}
</style>
