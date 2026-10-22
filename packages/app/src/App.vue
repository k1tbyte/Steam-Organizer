<script setup lang="ts">
import { FpToaster, FpTooltipHost } from '@so/ui'
import { defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'

// Dev only: production bundles never carry the panel or the controls it uses.
const MockPanel = import.meta.env.DEV
    ? defineAsyncComponent(() => import('#components/MockPanel.vue'))
    : undefined

const { t } = useI18n()
</script>

<template>
    <div class="bg-stage" aria-hidden="true" />
    <FpToaster :dismiss-label="t('Dismiss')">
        <RouterView />
        <MockPanel v-if="MockPanel" />
    </FpToaster>
    <FpTooltipHost />
</template>
