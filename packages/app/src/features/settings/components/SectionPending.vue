<script setup lang="ts">
import { FpEmpty, FpIcon } from '@so/ui'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<!-- Body of a section whose feature has not landed; its folder under sections/ replaces it. -->
<template>
    <FpEmpty :title="t('Nothing here yet')" :description="t('This section arrives with its feature.')">
        <template #leading><FpIcon name="icon-[lucide--hammer]" /></template>
    </FpEmpty>
</template>
