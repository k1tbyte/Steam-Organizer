<script setup lang="ts">
import { FpEyebrow, FpFormRow, FpIcon, FpToggleGroup } from '@so/ui'
import { useI18n } from 'vue-i18n'

import SectionNote from '../../components/SectionNote.vue'
import { useFieldsSection } from './useFieldsSection'

const { t } = useI18n()
const view = useFieldsSection()
</script>

<template>
    <div>
        <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1 pt-1.5 pb-2">
            <FpEyebrow class="ml-0! flex-1 basis-40">{{ t('Default for new accounts') }}</FpEyebrow>
            <span class="font-mono text-12 text-fg-3">{{ view.summary.value }}</span>
        </div>
        <FpFormRow
            v-for="row in view.rows.value"
            :key="row.key"
            plain
            compact
            inline
            class="min-h-13.25"
            :label="row.label">
            <template #leading>
                <FpIcon :name="row.icon" class="text-16 text-fg-3" />
            </template>
            <span v-if="row.fixed" class="flex items-center gap-1.5 pr-2.5 text-12.5 text-fg-3">
                <FpIcon name="icon-[lucide--lock-keyhole]" class="text-13" />
                {{ t('Always secret') }}
            </span>
            <FpToggleGroup
                v-else
                size="sm"
                :model-value="row.mode"
                :items="view.modeItems.value"
                :aria-label="row.label"
                @update:model-value="view.setMode(row.key, $event)">
                <template #default="{ option }">
                    <FpIcon v-if="option.icon" :name="option.icon" class="text-13" />
                    {{ option.label }}
                </template>
            </FpToggleGroup>
        </FpFormRow>
        <SectionNote icon="icon-[lucide--info]">
            {{ t('Each account can override this in its profile. Folder vaults also choose which fields show up in Obsidian notes.') }}
        </SectionNote>
    </div>
</template>
