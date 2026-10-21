<script setup lang="ts">
import { FpButton, FpIcon } from '@so/ui'
import { useI18n } from 'vue-i18n'

defineEmits<{ getExtension: [] }>()
const { t } = useI18n()
</script>

<template>
    <div
        class="surface-pop fixed bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded py-2 pr-2 pl-3.5 whitespace-nowrap">
        <FpIcon name="icon-[lucide--globe]" class="text-15 text-fg-3" aria-hidden="true" />
        <span class="text-13 text-fg-2">{{ t('Web version: Steam data is read-only.') }}</span>
        <FpButton size="sm" variant="soft" @click="$emit('getExtension')">
            {{ t('Get the extension') }}
        </FpButton>
        <span class="font-medium font-mono text-10.5 text-fg-faint">{{ t('WEB ONLY') }}</span>
    </div>
</template>
