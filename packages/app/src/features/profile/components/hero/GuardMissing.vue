<script setup lang="ts">
import { FpButton, FpIcon } from '@so/ui'
import { useI18n } from 'vue-i18n'

defineProps<{ touch: boolean }>()
const emit = defineEmits<{ importMaFile: [] }>()

const { t } = useI18n()
</script>

<template>
    <div
        class="flex items-center gap-2 rounded border border-stroke-2 border-dashed pr-1.5 pl-3 text-12.5 text-fg-3"
        :class="touch ? 'h-12' : 'h-9.5'">
        <FpIcon name="icon-[lucide--shield-off]" class="text-15" />
        <span class="flex-1">{{ t('No Steam Guard') }}</span>
        <FpButton size="xs" variant="ghost" color="accent" :label="t('Import maFile')" @click="emit('importMaFile')" />
    </div>
</template>
