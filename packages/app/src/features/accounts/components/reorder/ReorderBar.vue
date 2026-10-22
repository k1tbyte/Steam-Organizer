<script setup lang="ts">
import { FpButton, FpIcon } from '@so/ui'
import { useI18n } from 'vue-i18n'

import { useReorderBar } from '../../composables/reorder/useReorderBar'

const { t } = useI18n()
const bar = useReorderBar()
</script>

<template>
    <div class="flex items-center gap-u-3 px-u-6 py-u-3.5 max-lg:px-4 max-lg:py-2.5">
        <FpIcon name="icon-[lucide--grip-vertical]" class="shrink-0 text-fg-3" />
        <span class="min-w-0 flex-1 text-12.5 text-fg-2">{{ bar.hint.value }}</span>
        <FpButton size="sm" color="accent" @click="bar.close()">{{ t('Done') }}</FpButton>
    </div>
</template>
