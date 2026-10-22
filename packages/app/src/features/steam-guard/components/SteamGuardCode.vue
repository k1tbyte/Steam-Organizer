<script setup lang="ts">
import { FpCountdownRing, FpIcon, tip } from '@so/ui'
import { useI18n } from 'vue-i18n'

import { useGuardCode } from '../composables/useGuardCode'

const props = withDefaults(
    defineProps<{
        /** Account id: the demo code is derived from it. */
        seed: string
        /** `md` is the phone card's footer height. */
        size?: 'sm' | 'md'
    }>(),
    { size: 'sm' },
)

const { t } = useI18n()
const { holding, handlers, copied, shown, remaining, copyCode } = useGuardCode(
    () => props.seed,
)
</script>

<template>
    <div
        class="inline-flex min-w-0 shrink items-center overflow-hidden rounded bg-surface-hi"
        :class="size === 'md' ? 'h-9' : 'h-7'">
        <button
            v-bind="{ ...handlers, ...tip(t('Hold to show the code')) }"
            type="button"
            class="flex h-full cursor-pointer touch-none items-center gap-1.75 pr-2.5 pl-2 text-fg-1 transition-colors duration-fast select-none"
            :class="holding && 'bg-accent-soft'">
            <FpIcon
                :name="holding ? 'icon-[lucide--eye]' : 'icon-[lucide--shield-check]'"
                class="text-14 text-accent-ink" />
            <span class="w-14 text-left font-mono font-semibold text-13 tracking-[0.12em]">
                {{ shown }}
            </span>
            <FpCountdownRing :value="remaining" :size="14" />
        </button>
        <span class="h-4 w-px shrink-0 bg-stroke-2" />
        <button
            v-bind="tip(t('Copy code'), { label: true })"
            type="button"
            class="grid h-full shrink-0 cursor-pointer place-items-center text-13 text-fg-3 transition-colors duration-fast hover:text-fg-1"
            :class="size === 'md' ? 'w-10' : 'w-7.5'"
            @click="copyCode">
            <FpIcon :name="copied ? 'icon-[lucide--check]' : 'icon-[lucide--copy]'" />
        </button>
    </div>
</template>
