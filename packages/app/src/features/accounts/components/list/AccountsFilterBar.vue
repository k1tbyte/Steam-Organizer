<script setup lang="ts">
import { FpButton, FpIcon, FpTooltip, useDesktopLayout } from '@so/ui'
import { useScroll } from '@vueuse/core'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useScrollRoot } from '#core'

import BanFilterChips from './BanFilterChips.vue'
import CardFieldsPanel from './CardFieldsPanel.vue'
import SortMenu from './SortMenu.vue'

defineEmits<{ reorder: []; refreshAll: []; importExport: [] }>()

const { t } = useI18n()
const desktop = useDesktopLayout()

// Transparent over the page top, as in the mockup; the rail's surface once cards scroll under it.
const { arrivedState } = useScroll(useScrollRoot())
const scrolled = computed(() => !arrivedState.top)
</script>

<template>
    <div
        class="sticky top-0 z-10 border-b transition-colors duration-fast"
        :class="scrolled ? 'border-stroke-1 bg-canvas-elev backdrop-surface' : 'border-transparent'">
        <div v-if="desktop" class="flex items-center gap-1.5 px-u-6 py-u-3.5">
            <span class="mr-1 text-12.5 text-fg-3">{{ t('Bans') }}</span>
            <BanFilterChips />
            <span class="mx-1.5 h-4.5 w-px bg-stroke-1" />
            <SortMenu />
            <span class="flex-1" />
            <CardFieldsPanel />
            <FpTooltip :text="t('Reorder mode')" label>
                <FpButton
                    square
                    size="sm"
                    variant="ghost"
                    class="text-fg-3!"
                    @click="$emit('reorder')">
                    <FpIcon name="icon-[lucide--grip-vertical]" />
                </FpButton>
            </FpTooltip>
            <FpTooltip :text="t('Refresh all')" label>
                <FpButton
                    square
                    size="sm"
                    variant="ghost"
                    class="text-fg-3!"
                    @click="$emit('refreshAll')">
                    <FpIcon name="icon-[lucide--refresh-cw]" />
                </FpButton>
            </FpTooltip>
            <FpTooltip :text="t('Import / export')" label>
                <FpButton
                    square
                    size="sm"
                    variant="ghost"
                    class="text-fg-3!"
                    @click="$emit('importExport')">
                    <FpIcon name="icon-[lucide--ellipsis]" />
                </FpButton>
            </FpTooltip>
        </div>
        <!-- Scrolls sideways only: a vertical swipe passes to the page. -->
        <div v-else class="flex items-center gap-1.5 overflow-x-auto overflow-y-hidden px-4 py-2.5">
            <SortMenu />
            <span class="mx-0.5 h-5 w-px shrink-0 bg-stroke-1" />
            <BanFilterChips />
            <span class="mx-0.5 h-5 w-px shrink-0 bg-stroke-1" />
            <CardFieldsPanel />
        </div>
    </div>
</template>
