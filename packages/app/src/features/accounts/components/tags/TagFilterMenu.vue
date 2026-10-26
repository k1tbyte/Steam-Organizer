<script setup lang="ts">
import { FpBadge, FpButton, FpCheckbox, FpEyebrow, FpIcon, FpPopover, FpToggleGroup } from '@so/ui'
import { useI18n } from 'vue-i18n'

import { useTagFilter } from '../../composables/tags/useTagFilter'

const { t } = useI18n()
const filter = useTagFilter()
</script>

<template>
    <FpPopover sheet :padded="false" width="min(92vw, 16rem)" max-height="26rem" placement="bottom-start" :label="t('Tags')">
        <FpButton
            round
            size="xs"
            :variant="filter.count.value ? 'soft' : 'outline'"
            :color="filter.count.value ? 'accent' : 'neutral'"
            class="shrink-0">
            <FpIcon name="icon-[lucide--tag]" />
            {{ t('Tags') }}
            <FpBadge v-if="filter.count.value" color="accent" :label="filter.count.value" />
        </FpButton>
        <template #content>
            <div class="flex items-center justify-between gap-2 px-3.5 pt-3 pb-1.5">
                <FpEyebrow class="ml-0!">{{ t('Tags') }}</FpEyebrow>
                <FpToggleGroup
                    size="sm"
                    :items="filter.matchItems.value"
                    :model-value="filter.match.value"
                    :aria-label="t('Accounts with')"
                    @update:model-value="filter.setMatch" />
            </div>
            <p v-if="filter.rows.value.length === 0" class="px-3.5 pt-1 pb-3.5 text-12.5 text-fg-3">
                {{ t('No tags yet. Add them from a card or a profile.') }}
            </p>
            <div class="flex flex-col gap-px p-1.5">
                <label
                    v-for="row in filter.rows.value"
                    :key="row.id"
                    class="touch-row flex h-8 cursor-pointer items-center gap-2.5 rounded px-2 text-13 text-fg-1 hover:bg-hover">
                    <FpCheckbox :model-value="row.on" size="sm" @update:model-value="filter.toggle(row.id)" />
                    <span class="tag-dot size-2 rounded-full" :style="{ '--hue': row.hue }" />
                    <span class="min-w-0 flex-1 truncate">{{ row.label }}</span>
                    <span class="font-mono text-11.5 text-fg-3">{{ row.count }}</span>
                </label>
            </div>
            <div v-if="filter.count.value" class="border-t border-stroke-1 p-1.5">
                <FpButton size="sm" variant="ghost" block class="justify-start!" @click="filter.clear()">
                    {{ t('Clear tags') }}
                </FpButton>
            </div>
        </template>
    </FpPopover>
</template>
