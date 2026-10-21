<script setup lang="ts">
import { FpToaster } from '@so/ui'
import { TooltipProvider } from 'reka-ui'
import { useI18n } from 'vue-i18n'

import MockPanel from '#components/MockPanel.vue'

const { t } = useI18n()
</script>

<template>
    <div class="bg-stage" aria-hidden="true" />
    <TooltipProvider :delay-duration="400">
        <FpToaster :dismiss-label="t('Dismiss')">
            <RouterView />
            <MockPanel />
        </FpToaster>
    </TooltipProvider>
</template>
