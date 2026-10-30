<script setup lang="ts">
import { FpBadge, FpButton, FpIcon } from '@so/ui'
import { useI18n } from 'vue-i18n'

import type { BackupRow } from '../model'

defineProps<{ row: BackupRow }>()
const emit = defineEmits<{
    restore: []
    askDelete: []
    cancelDelete: []
    remove: []
}>()

const { t } = useI18n()
</script>

<!-- Phones drop the tile and the size; restore and delete shrink to icons, the confirmation takes its own line. -->
<template>
    <div
        class="flex flex-col gap-2.5 border-stroke-1 border-t py-3 pr-1.5 pl-3.5 transition-colors duration-fast"
        :class="row.confirmingDelete && 'bg-danger-soft'">
        <div class="flex items-center gap-3">
            <div class="flex min-w-0 flex-1 flex-col gap-[3px]">
                <div class="flex min-w-0 items-center gap-2">
                    <span class="truncate font-medium text-13.5 text-fg-1">{{ row.title }}</span>
                    <FpBadge v-if="row.latest" color="accent" :label="t('Latest')" />
                </div>
                <span class="text-12 text-fg-3">{{ row.metaShort }}</span>
            </div>
            <span v-if="row.saving" class="pr-2.5 text-12 text-accent-ink">
                {{ t('Saving…') }}
            </span>
            <template v-else-if="!row.confirmingDelete">
                <FpButton
                    square
                    round
                    variant="ghost"
                    size="xl"
                    :aria-label="t('Restore')"
                    @click="emit('restore')">
                    <FpIcon name="icon-[lucide--rotate-ccw]" />
                </FpButton>
                <FpButton
                    square
                    round
                    variant="ghost"
                    size="xl"
                    class="text-fg-3!"
                    :aria-label="t('Delete')"
                    @click="emit('askDelete')">
                    <FpIcon name="icon-[lucide--trash-2]" />
                </FpButton>
            </template>
        </div>
        <div v-if="row.confirmingDelete" class="flex items-center gap-2 pr-2">
            <span class="flex-1 font-medium text-13 text-fg-1">{{ t('Delete this backup?') }}</span>
            <FpButton variant="soft" size="lg" :label="t('Cancel')" @click="emit('cancelDelete')" />
            <FpButton color="danger" size="lg" :label="t('Delete')" @click="emit('remove')" />
        </div>
    </div>
</template>
