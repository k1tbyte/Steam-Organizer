<script setup lang="ts">
import { FpButton, FpIcon, useDesktopLayout } from '@so/ui'
import { onKeyStroke } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

import { usePageActive } from '#core'

import { useReorderMode } from '../../composables/reorder/useReorderMode'

// Esc there belongs to the overlay.
const OVERLAY = '[role="dialog"], [role="menu"], [role="listbox"]'

const { t } = useI18n()
const desktop = useDesktopLayout()
const mode = useReorderMode()

// Mounted with the mode even when the grid is not (an empty vault); a drag in the grid takes Esc first.
const active = usePageActive()
onKeyStroke('Escape', (event) => {
    const inOverlay = event.target instanceof Element && event.target.closest(OVERLAY)
    if (active.value && !event.defaultPrevented && !inOverlay) mode.close()
})
</script>

<template>
    <div class="flex items-center gap-u-3 px-u-6 py-u-3.5 max-lg:px-4 max-lg:py-2.5">
        <FpIcon name="icon-[lucide--grip-vertical]" class="shrink-0 text-fg-3" />
        <span class="min-w-0 flex-1 text-12.5 text-fg-2">
            {{ desktop ? t('Drag cards to reorder them, or move one with the arrow keys') : t('Drag a card by its handle') }}
        </span>
        <FpButton size="sm" color="accent" @click="mode.close()">{{ t('Done') }}</FpButton>
    </div>
</template>
