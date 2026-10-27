<script setup lang="ts">
import { FpButton, FpIcon, tip, useDesktopLayout } from '@so/ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useScrollTop } from '#core'

import { useEditMode } from '../../composables/edit/useEditMode'
import { useBulkRefresh } from '../../composables/refresh/useBulkRefresh'
import EditBar from '../edit/EditBar.vue'
import TagFilterMenu from '../tags/TagFilterMenu.vue'
import BanFilterChips from './BanFilterChips.vue'
import CardFieldsPanel from './CardFieldsPanel.vue'
import SortMenu from './SortMenu.vue'

defineEmits<{ importExport: [] }>()

const { t } = useI18n()
const desktop = useDesktopLayout()
const edit = useEditMode()
const bulk = useBulkRefresh()

// Transparent at the page top, as in the mockup; the rail's surface once the list scrolls.
const top = useScrollTop()
const scrolled = computed(() => top.value > 0)
</script>

<template>
    <div
        class="shrink-0 border-b transition-colors duration-fast"
        :class="scrolled ? 'border-stroke-1 bg-canvas-elev backdrop-surface' : 'border-transparent'">
        <EditBar v-if="edit.open.value" />
        <div v-else-if="desktop" class="flex items-center gap-1.5 px-u-6 py-u-3.5">
            <span class="mr-1 text-12.5 text-fg-3">{{ t('Bans') }}</span>
            <BanFilterChips />
            <TagFilterMenu />
            <span class="mx-1.5 h-4.5 w-px bg-stroke-1" />
            <SortMenu />
            <span class="flex-1" />
            <CardFieldsPanel />
            <FpButton
                v-bind="tip(t('Edit mode'), { label: true })"
                square
                size="sm"
                variant="ghost"
                class="text-fg-3!"
                @click="edit.show()">
                <FpIcon name="icon-[lucide--square-pen]" />
            </FpButton>
            <FpButton
                v-if="bulk.available"
                v-bind="tip(t('Refresh all'), { label: true })"
                square
                size="sm"
                variant="ghost"
                class="text-fg-3!"
                :disabled="bulk.running.value"
                @click="bulk.refreshAll">
                <FpIcon name="icon-[lucide--refresh-cw]" />
            </FpButton>
            <FpButton
                v-bind="tip(t('Import / export'), { label: true })"
                square
                size="sm"
                variant="ghost"
                class="text-fg-3!"
                @click="$emit('importExport')">
                <FpIcon name="icon-[lucide--ellipsis]" />
            </FpButton>
        </div>
        <div v-else class="flex items-center gap-1.5 overflow-x-auto overflow-y-hidden px-4 py-2.5">
            <SortMenu />
            <span class="mx-0.5 h-5 w-px shrink-0 bg-stroke-1" />
            <BanFilterChips />
            <TagFilterMenu />
            <span class="mx-0.5 h-5 w-px shrink-0 bg-stroke-1" />
            <CardFieldsPanel />
            <span class="mx-0.5 h-5 w-px shrink-0 bg-stroke-1" />
            <FpButton
                :aria-label="t('Edit mode')"
                square
                size="sm"
                variant="ghost"
                class="shrink-0 text-fg-3!"
                @click="edit.show()">
                <FpIcon name="icon-[lucide--square-pen]" />
            </FpButton>
            <FpButton
                v-if="bulk.available"
                :aria-label="t('Refresh all')"
                square
                size="sm"
                variant="ghost"
                class="shrink-0 text-fg-3!"
                :disabled="bulk.running.value"
                @click="bulk.refreshAll">
                <FpIcon name="icon-[lucide--refresh-cw]" />
            </FpButton>
        </div>
    </div>
</template>

