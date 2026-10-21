<script setup lang="ts">
import { FpCard, FpCollapsible, FpIcon } from '@so/ui'

import { useProfileSection } from '../../composables/useProfileSection'
import type { ProfileSection } from '../../model'

const props = defineProps<{ section: ProfileSection; title: string; icon: string }>()

const { open, toggle } = useProfileSection(() => props.section)
</script>

<template>
    <FpCard flush>
        <!-- The title button stretches over the row; the actions sit above it. -->
        <div class="relative flex h-12.5 items-center gap-2.5 pr-3 pl-4 max-lg:h-13 max-lg:pr-3.5">
            <FpIcon :name="icon" class="text-16 text-fg-3" />
            <button
                type="button"
                :aria-expanded="open"
                class="flex min-w-0 cursor-pointer items-center gap-2.5 font-semibold text-14 text-fg-1 select-none after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-accent"
                @click="toggle">
                {{ title }}
                <slot name="meta" />
            </button>
            <span class="flex-1" />
            <div class="relative z-1"><slot name="actions" /></div>
            <FpIcon
                name="icon-[lucide--chevron-down]"
                class="text-16 text-fg-3 transition-transform duration-fast"
                :class="!open && '-rotate-90'" />
        </div>
        <FpCollapsible :open="open">
            <slot />
        </FpCollapsible>
    </FpCard>
</template>
