<script setup lang="ts">
import { FpIcon } from '@so/ui'
import { useI18n } from 'vue-i18n'

defineProps<{ group: 'pinned' | 'all' }>()

const { t } = useI18n()
</script>

<template>
    <h2 class="flex h-4 items-center gap-1.5 px-0.5 font-medium text-12.5 text-fg-3">
        <template v-if="group === 'pinned'">
            <FpIcon name="icon-[lucide--pin]" class="text-13" />
            {{ t('Pinned') }}
        </template>
        <template v-else>{{ t('All accounts') }}</template>
    </h2>
</template>
