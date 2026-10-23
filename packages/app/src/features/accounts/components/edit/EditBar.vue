<script setup lang="ts">
import { FpButton, FpIcon } from '@so/ui'
import { useI18n } from 'vue-i18n'

import { useEditBar } from '../../composables/edit/useEditBar'
import BanFilterChips from '../list/BanFilterChips.vue'

const { t } = useI18n()
const bar = useEditBar()
</script>

<!-- The filter strip with the sort and the tools swapped for the mode's status. On phones the chips scroll, the buttons stay.
     Its row is as tall as the tools' (30px), so entering the mode moves nothing: the sm text buttons are 32px. -->
<template>
    <div class="flex items-center gap-1.5 max-lg:pr-4 lg:box-content lg:h-7.5 lg:px-u-6 lg:py-u-3.5">
        <div class="flex min-w-0 flex-1 items-center gap-1.5 max-lg:overflow-x-auto max-lg:overflow-y-hidden max-lg:py-2.5 max-lg:pl-4">
            <span class="mr-1 text-12.5 text-fg-3 max-lg:hidden">{{ t('Bans') }}</span>
            <BanFilterChips />
            <span class="mx-0.5 h-5 w-px shrink-0 bg-stroke-1 lg:mx-1.5 lg:h-4.5" />
            <FpIcon name="icon-[lucide--grip-vertical]" class="shrink-0 text-fg-3" />
            <span class="whitespace-nowrap text-12.5 text-fg-2 lg:min-w-0 lg:truncate">{{ bar.label.value }}</span>
        </div>
        <FpButton v-if="bar.picking.value" size="sm" variant="ghost" @click="bar.clear()">{{ t('Clear') }}</FpButton>
        <FpButton size="sm" color="accent" @click="bar.close()">{{ t('Done') }}</FpButton>
    </div>
</template>
