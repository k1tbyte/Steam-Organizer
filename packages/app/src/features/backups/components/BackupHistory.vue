<script setup lang="ts">
import {
    type AsyncStatus,
    FpAsyncView,
    FpCard,
    FpEmpty,
    FpIcon,
    useDesktopLayout,
} from '@so/ui'
import { useI18n } from 'vue-i18n'

import type { BackupRow as Row } from '../model'
import BackupRow from './BackupRow.vue'
import BackupRowPhone from './BackupRowPhone.vue'

defineProps<{ rows: Row[]; status: AsyncStatus }>()
const emit = defineEmits<{
    restore: [id: string]
    askDelete: [id: string]
    cancelDelete: []
    remove: [id: string]
}>()

const { t } = useI18n()
const desktop = useDesktopLayout()
</script>

<template>
    <FpCard flush>
        <div v-if="desktop" class="flex h-12 items-center justify-between gap-2.5 px-4">
            <h2 class="font-semibold text-14 text-fg-1">{{ t('History') }}</h2>
            <span class="text-12.5 text-fg-3">{{ t('Newest first') }}</span>
        </div>
        <FpAsyncView :status="status">
            <component
                :is="desktop ? BackupRow : BackupRowPhone"
                v-for="row in rows"
                :key="row.id"
                :row="row"
                @restore="emit('restore', row.id)"
                @ask-delete="emit('askDelete', row.id)"
                @cancel-delete="emit('cancelDelete')"
                @remove="emit('remove', row.id)" />
            <template #empty>
                <FpEmpty
                    class="border-stroke-1 border-t"
                    :title="t('No backups yet')"
                    :description="t('Backups appear here as the vault changes. Back up now to save one right away.')">
                    <template #leading>
                        <FpIcon name="icon-[lucide--cloud]" />
                    </template>
                </FpEmpty>
            </template>
        </FpAsyncView>
    </FpCard>
</template>
