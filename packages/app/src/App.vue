<script setup lang="ts">
import { FpToaster, FpTooltipHost } from '@so/ui'
import { useI18n } from 'vue-i18n'

import MockPanel from '#components/MockPanel.vue'

const { t } = useI18n()
</script>

<template>
    <div class="bg-stage" aria-hidden="true" />
    <FpToaster :dismiss-label="t('Dismiss')">
        <RouterView />
        <MockPanel />
    </FpToaster>
    <FpTooltipHost />
</template>
