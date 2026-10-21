<script setup lang="ts">
import { FpButton, FpIcon } from '@so/ui'
import { useI18n } from 'vue-i18n'

import BanFilterChips from './BanFilterChips.vue'
import CardFieldsPanel from './CardFieldsPanel.vue'
import SortMenu from './SortMenu.vue'

defineEmits<{ reorder: []; refreshAll: []; importExport: [] }>()

const { t } = useI18n()
</script>

<!-- Desktop only: phones keep the same controls in a scrolling strip under the search. -->
<template>
    <div
        class="backdrop-surface sticky top-0 z-10 flex items-center gap-1.5 bg-canvas/95 px-u-6 py-u-3.5">
        <span class="mr-1 text-12.5 text-fg-3">{{ t('Bans') }}</span>
        <BanFilterChips />
        <span class="mx-1.5 h-4.5 w-px bg-stroke-1" />
        <SortMenu />
        <span class="flex-1" />
        <CardFieldsPanel />
        <FpButton
            square
            size="sm"
            variant="ghost"
            class="text-fg-3!"
            :title="t('Reorder mode')"
            @click="$emit('reorder')">
            <FpIcon name="icon-[lucide--grip-vertical]" />
        </FpButton>
        <FpButton
            square
            size="sm"
            variant="ghost"
            class="text-fg-3!"
            :title="t('Refresh all')"
            @click="$emit('refreshAll')">
            <FpIcon name="icon-[lucide--refresh-cw]" />
        </FpButton>
        <FpButton
            square
            size="sm"
            variant="ghost"
            class="text-fg-3!"
            :title="t('Import / export')"
            @click="$emit('importExport')">
            <FpIcon name="icon-[lucide--ellipsis]" />
        </FpButton>
    </div>
</template>
