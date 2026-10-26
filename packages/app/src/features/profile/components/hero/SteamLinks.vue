<script setup lang="ts">
import { FpIcon, tip } from '@so/ui'

import type { ProfileHeaderState } from '../../composables/hero/useProfileHeader'

defineProps<{ links: ProfileHeaderState['links']; touch: boolean }>()
</script>

<template>
    <nav
        class="flex items-center"
        :class="touch ? '-mx-4 gap-1.5 overflow-x-auto px-4' : '-ml-2 gap-0.5'">
        <a
            v-for="link in links"
            :key="link.key"
            v-bind="tip(link.title, { disabled: touch })"
            :href="link.href"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex shrink-0 items-center transition-colors duration-fast"
            :class="
                touch
                    ? 'h-9 gap-1.5 rounded-full px-3 text-12 text-fg-2 ring-1 ring-stroke-1 ring-inset'
                    : 'h-6.5 gap-1.25 rounded px-2 text-12.5 text-fg-3 hover:bg-hover hover:text-fg-1'
            ">
            <FpIcon :name="link.icon" class="text-13" />
            {{ link.label }}
        </a>
    </nav>
</template>
