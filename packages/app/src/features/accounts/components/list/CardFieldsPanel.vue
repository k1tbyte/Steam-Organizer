<script setup lang="ts">
import { FpButton, FpIcon, FpPopover, FpScrollArea, FpTooltip, useDesktopLayout } from '@so/ui'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { useCardFields } from '../../composables/useCardFields'
import CardFieldRows from './CardFieldRows.vue'

const { t } = useI18n()
const desktop = useDesktopLayout()
const { reset, cardHeight } = useCardFields()
const open = ref(false)
</script>

<template>
    <FpPopover
        v-model:open="open"
        sheet
        :padded="false"
        placement="bottom-end"
        width="min(92vw, 21.25rem)"
        max-height="41rem"
        :label="t('Card fields')">
        <FpTooltip v-if="desktop" :text="t('Choose what cards show')" :disabled="open">
            <FpButton
                size="xs"
                variant="ghost"
                :class="open ? 'bg-hover-hi! text-fg-1!' : 'text-fg-2!'">
                <FpIcon name="icon-[lucide--panels-top-left]" />
                {{ t('Card fields') }}
            </FpButton>
        </FpTooltip>
        <FpButton v-else round size="xs" variant="outline" class="shrink-0" :aria-label="t('Card fields')">
            <FpIcon name="icon-[lucide--panels-top-left]" />
            {{ t('Card') }}
        </FpButton>

        <template #content="{ close }">
            <div class="flex items-center gap-2 pt-1 pr-3 pb-2 pl-5 lg:pt-3.5 lg:pr-3.5 lg:pb-2.5 lg:pl-4">
                <span class="flex-1 font-semibold text-15.5 text-fg-1 lg:text-14">{{ t('Card fields') }}</span>
                <FpButton variant="ghost" :size="desktop ? 'xs' : 'md'" class="text-fg-3!" @click="reset">
                    {{ t('Reset') }}
                </FpButton>
                <FpButton v-if="!desktop" size="md" color="accent" :label="t('Done')" @click="close" />
            </div>
            <FpScrollArea v-if="desktop" class="max-h-140">
                <CardFieldRows />
            </FpScrollArea>
            <div v-else class="max-h-[calc(76dvh-8.5rem)] overflow-y-auto">
                <CardFieldRows />
            </div>
            <div
                v-if="desktop"
                class="flex items-center gap-2 border-stroke-1 border-t px-4 py-2.5 text-12 text-fg-3">
                <FpIcon name="icon-[lucide--ruler]" />
                {{ t('Card height') }}
                <span class="flex-1" />
                <span class="font-mono text-fg-2">{{ cardHeight }}</span>
            </div>
        </template>
    </FpPopover>
</template>
