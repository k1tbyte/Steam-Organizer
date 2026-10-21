<script setup lang="ts">
import { FpButton, FpIcon, FpIconTile, FpPopover, useDesktopLayout } from '@so/ui'
import { useI18n } from 'vue-i18n'

import type { VaultSummary } from '../../model'

export interface VaultRow extends VaultSummary {
    icon: string
    active: boolean
}

defineProps<{ rows: VaultRow[]; current?: VaultSummary; currentIcon: string }>()
defineEmits<{ pick: [id: string]; add: []; remove: [] }>()

const open = defineModel<boolean>('open', { default: false })
const { t } = useI18n()
const desktop = useDesktopLayout()
</script>

<template>
    <FpPopover
        v-model:open="open"
        sheet
        :padded="false"
        :label="t('Vaults')"
        width="min(92vw, 25rem)">
        <button
            v-if="desktop"
            type="button"
            class="surface flex h-15 w-full items-center gap-3 rounded py-0 pr-3.5 pl-2.5 text-left transition-colors duration-fast hover:border-stroke-2">
            <FpIconTile :name="currentIcon" />
            <span class="flex min-w-0 flex-1 flex-col gap-0.5">
                <span class="font-semibold text-14.5 text-fg-1">{{ current?.name }}</span>
                <span class="truncate text-12.5 text-fg-3">{{ current?.meta }}</span>
            </span>
            <FpIcon name="icon-[lucide--chevrons-up-down]" class="text-15 text-fg-3" aria-hidden="true" />
        </button>
        <button
            v-else
            type="button"
            class="surface flex h-11 items-center gap-2 rounded-full py-0 pr-3.5 pl-2.5 font-semibold text-15 text-fg-1">
            <FpIconTile :name="currentIcon" size="xs" round />
            {{ current?.name }}
            <FpIcon name="icon-[lucide--chevron-down]" class="text-16 text-fg-3" aria-hidden="true" />
        </button>

        <template #content>
            <div class="flex flex-col p-1.5">
                <button
                    v-for="row in rows"
                    :key="row.id"
                    type="button"
                    class="touch-row flex min-h-13 w-full items-center gap-3 rounded px-2 text-left hover:bg-hover"
                    @click="$emit('pick', row.id)">
                    <FpIconTile :name="row.icon" size="sm" />
                    <span class="flex min-w-0 flex-1 flex-col gap-px">
                        <span class="font-semibold text-13.5 text-fg-1">{{ row.name }}</span>
                        <span class="truncate text-12 text-fg-3">{{ row.meta }}</span>
                    </span>
                    <FpIcon
                        name="icon-[lucide--check]"
                        class="text-15 text-accent-ink"
                        :class="!row.active && 'opacity-0'"
                        aria-hidden="true" />
                </button>
                <div class="mt-1 flex items-center gap-1 border-stroke-1 border-t pt-1.5">
                    <FpButton variant="ghost" class="flex-1 justify-start" @click="$emit('add')">
                        <FpIcon name="icon-[lucide--plus]" class="text-fg-3" aria-hidden="true" />
                        {{ t('Add vault') }}
                    </FpButton>
                    <FpButton variant="ghost" class="text-fg-3!" @click="$emit('remove')">
                        {{ t('Remove from this device…') }}
                    </FpButton>
                </div>
            </div>
        </template>
    </FpPopover>
</template>
