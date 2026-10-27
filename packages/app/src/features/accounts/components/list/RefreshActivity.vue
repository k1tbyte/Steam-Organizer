<script setup lang="ts">
import { FpCountdownRing, tip, useDesktopLayout } from '@so/ui'
import { useI18n } from 'vue-i18n'

defineProps<{ remaining: number; progress: number; stopping: boolean }>()
const emit = defineEmits<{ stop: [] }>()

const { t } = useI18n()
const desktop = useDesktopLayout()
</script>

<!-- Accounts left in a bulk refresh: a pill beside the actions on desktop, a ring on phones. A press stops it. -->
<template>
    <button
        v-if="desktop"
        v-bind="tip(t('Stop refreshing · {count} left', { count: remaining }), { label: true })"
        type="button"
        :disabled="stopping"
        class="flex h-7 cursor-pointer items-center gap-1.5 rounded-full pr-2.25 pl-1.5 font-medium font-mono text-12 text-fg-2 ring-1 ring-stroke-1 ring-inset transition-colors duration-fast hover:bg-hover disabled:cursor-default disabled:opacity-60"
        @click="emit('stop')">
        <FpCountdownRing :value="progress" :size="14" />
        {{ remaining }}
    </button>
    <button
        v-else
        type="button"
        :disabled="stopping"
        class="grid size-11 place-items-center rounded-full disabled:opacity-60"
        :aria-label="t('Stop refreshing · {count} left', { count: remaining })"
        @click="emit('stop')">
        <FpCountdownRing :value="progress" :size="26" :thickness="2.5">
            <span class="font-mono font-semibold text-10 text-fg-1">{{ remaining }}</span>
        </FpCountdownRing>
    </button>
</template>
