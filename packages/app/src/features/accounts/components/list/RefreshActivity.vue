<script setup lang="ts">
import { FpCountdownRing, useDesktopLayout } from '@so/ui'
import { useI18n } from 'vue-i18n'

defineProps<{ remaining: number; progress: number }>()

const { t } = useI18n()
const desktop = useDesktopLayout()
</script>

<!-- Accounts left in a bulk refresh: a pill beside the actions on desktop, a ring on phones. -->
<template>
    <span
        v-if="desktop"
        class="flex h-7 items-center gap-1.5 rounded-full pr-2.25 pl-1.5 font-medium font-mono text-12 text-fg-2 ring-1 ring-stroke-1 ring-inset"
        :title="t('Refreshing {count} accounts', { count: remaining })">
        <FpCountdownRing :value="progress" :size="14" />
        {{ remaining }}
    </span>
    <span
        v-else
        class="grid size-11 place-items-center"
        :title="t('Refreshing {count} accounts', { count: remaining })">
        <FpCountdownRing :value="progress" :size="26" :thickness="2.5">
            <span class="font-mono font-semibold text-10 text-fg-1">{{ remaining }}</span>
        </FpCountdownRing>
    </span>
</template>
