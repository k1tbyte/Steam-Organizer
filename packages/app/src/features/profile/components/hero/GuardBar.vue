<script setup lang="ts">
import { FpCountdownRing, FpIcon, tip } from '@so/ui'
import { useI18n } from 'vue-i18n'

import { useGuardCode } from '#features/steam-guard'

const props = defineProps<{ seed: string; touch: boolean }>()

const { t } = useI18n()
const { holding, handlers, copied, shown, remaining, copyCode } = useGuardCode(() => props.seed)
</script>

<template>
    <div class="flex items-center overflow-hidden rounded bg-surface-hi" :class="touch ? 'h-12' : 'h-9.5'">
        <button
            v-bind="{ ...handlers, ...tip(t('Hold to show the code'), { disabled: touch }) }"
            type="button"
            class="flex h-full min-w-0 flex-1 cursor-pointer touch-none items-center gap-2 px-3 text-fg-1 transition-colors duration-fast select-none max-lg:gap-2.5 max-lg:px-3.5"
            :class="holding && 'bg-accent-soft'">
            <FpIcon
                :name="holding ? 'icon-[lucide--eye]' : 'icon-[lucide--shield-check]'"
                class="text-15 text-accent-ink" />
            <span class="font-medium text-12.5 text-fg-2">
                {{ touch ? t('Hold for code') : t('Steam Guard') }}
            </span>
            <span class="flex-1" />
            <span class="font-mono font-semibold text-14 tracking-[0.14em]">{{ shown }}</span>
            <FpCountdownRing :value="remaining" :size="touch ? 16 : 14" />
        </button>
        <span class="h-4 w-px shrink-0 bg-stroke-2" />
        <button
            v-bind="tip(t('Copy code'), { disabled: touch })"
            type="button"
            :aria-label="t('Copy code')"
            class="grid h-full w-9 shrink-0 cursor-pointer place-items-center text-14 transition-colors duration-fast max-lg:w-12"
            :class="copied ? 'text-success' : 'text-fg-3 hover:text-fg-1'"
            @click="copyCode">
            <FpIcon :name="copied ? 'icon-[lucide--check]' : 'icon-[lucide--copy]'" />
        </button>
    </div>
</template>
