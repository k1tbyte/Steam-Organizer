<script setup lang="ts">
import { FpIcon, FpTooltip } from '@so/ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { AccountTag } from '../../model'

const props = defineProps<{
    shown: AccountTag[]
    hidden: AccountTag[]
    touch: boolean
}>()
const emit = defineEmits<{ edit: [] }>()

const { t } = useI18n()
const hiddenNames = computed(() => props.hidden.map((tag) => tag.label).join(', '))
</script>

<template>
    <div
        class="flex shrink-0 items-center gap-1 overflow-hidden"
        :class="touch ? 'h-7' : 'h-5.5'">
        <span
            v-for="tag in shown"
            :key="tag.label"
            class="inline-flex h-5.5 shrink-0 items-center gap-1.25 rounded-full bg-surface-hi pr-2 pl-1.75 font-medium text-12 text-fg-2">
            <span class="dot size-1.5 rounded-full" :style="{ '--hue': tag.hue }" />
            {{ tag.label }}
        </span>
        <FpTooltip v-if="hidden.length > 0" :text="hiddenNames">
            <span
                class="inline-flex h-5.5 shrink-0 items-center rounded-full bg-surface-hi px-1.75 font-medium font-mono text-11.5 text-fg-2">
                +{{ hidden.length }}
            </span>
        </FpTooltip>
        <FpTooltip v-if="shown.length > 0" :text="t('Edit tags')" label>
            <button
                type="button"
                class="grid shrink-0 cursor-pointer place-items-center rounded-full text-13 text-fg-3 transition-colors duration-fast hover:bg-hover hover:text-fg-1"
                :class="touch ? 'size-7' : 'size-5.5'"
                @click="emit('edit')">
                <FpIcon name="icon-[lucide--plus]" />
            </button>
        </FpTooltip>
        <button
            v-else
            type="button"
            class="inline-flex h-5.5 shrink-0 cursor-pointer items-center gap-1 rounded-full pr-2.25 pl-1.75 font-medium text-12 text-fg-3 ring-1 ring-stroke-2 ring-inset transition-colors duration-fast hover:text-fg-1 hover:ring-fg-3"
            @click="emit('edit')">
            <FpIcon name="icon-[lucide--plus]" class="text-12" />
            {{ t('Add tag') }}
        </button>
    </div>
</template>

<style scoped>
.dot {
    --dot-l: 0.72;
    background: oklch(var(--dot-l) 0.14 var(--hue));
}
:global([data-mode='light']) .dot {
    --dot-l: 0.6;
}
</style>
