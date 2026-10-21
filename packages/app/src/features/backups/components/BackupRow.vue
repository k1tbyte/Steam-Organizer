<script setup lang="ts">
import {
    FpBadge,
    FpButton,
    FpIcon,
    FpIconTile,
    FpListRow,
    FpProgress,
} from '@so/ui'
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

<!-- 85px is the mockup's content-box min-height 64 plus its padding and hairline. -->
<template>
    <FpListRow
        :title="row.title"
        class="min-h-21.25! transition-colors duration-fast"
        :class="row.confirmingDelete && 'bg-danger-soft'">
        <template #leading>
            <FpIconTile :name="row.icon" size="base" />
        </template>
        <template #badge>
            <FpBadge v-if="row.latest" color="accent" :label="t('Latest')" />
            <FpBadge
                v-if="row.olderPassword"
                outline
                icon="icon-[lucide--key-round]"
                :label="t('Older password')"
                :title="t('Made before the master password changed')" />
        </template>
        <template #meta>
            <span class="text-12.5 text-fg-3 tabular-nums">{{ row.meta }}</span>
        </template>
        <template #actions>
            <span
                v-if="row.saving"
                class="flex items-center gap-2.5 pr-2 text-12.5 text-accent-ink">
                {{ t('Saving to Drive') }}
                <span class="w-18">
                    <FpProgress size="sm" :aria-label="t('Saving to Drive')" />
                </span>
            </span>
            <div v-else-if="row.confirmingDelete" class="flex items-center gap-1.5">
                <span class="mr-1.5 font-medium text-13 text-fg-1">
                    {{ t('Delete this backup?') }}
                </span>
                <FpButton
                    variant="ghost"
                    size="sm"
                    :label="t('Cancel')"
                    @click="emit('cancelDelete')" />
                <FpButton
                    color="danger"
                    size="sm"
                    :label="t('Delete')"
                    @click="emit('remove')" />
            </div>
            <div v-else class="flex items-center gap-0.5">
                <FpButton
                    variant="ghost"
                    size="sm"
                    :title="t('Restore this backup')"
                    @click="emit('restore')">
                    <FpIcon name="icon-[lucide--rotate-ccw]" aria-hidden="true" />
                    {{ t('Restore') }}
                </FpButton>
                <FpButton
                    square
                    variant="ghost"
                    color="danger"
                    size="sm"
                    class="text-fg-3! hover:text-danger!"
                    :aria-label="t('Delete')"
                    :title="t('Delete')"
                    @click="emit('askDelete')">
                    <FpIcon name="icon-[lucide--trash-2]" />
                </FpButton>
            </div>
        </template>
    </FpListRow>
</template>
