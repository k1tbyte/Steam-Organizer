<script setup lang="ts">
import { FpButton, FpEmpty, FpIcon } from '@so/ui'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

const { t } = useI18n()
</script>

<template>
    <div class="grid min-h-dvh place-items-center">
        <FpEmpty :title="t('Page not found')" :description="t('The address does not lead anywhere in the app.')">
            <template #leading><FpIcon name="icon-[lucide--compass]" /></template>
            <template #actions>
                <FpButton :as="RouterLink" to="/" color="accent">{{ t('Back to accounts') }}</FpButton>
            </template>
        </FpEmpty>
    </div>
</template>
