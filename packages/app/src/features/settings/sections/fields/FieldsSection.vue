<script setup lang="ts">
import { FpAlert, FpButton, FpEyebrow, FpFormRow, FpIcon, FpProgress, FpToggleGroup } from '@so/ui'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

import SectionNote from '../../components/SectionNote.vue'
import { useFieldsSection } from './useFieldsSection'

const { t } = useI18n()
const view = reactive(useFieldsSection())
</script>

<template>
    <div class="flex flex-col">
        <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1 pt-1.5 pb-2">
            <FpEyebrow class="ml-0! flex-1 basis-40">{{ t('Every account') }}</FpEyebrow>
            <span class="font-mono text-12 text-fg-3">{{ view.summary }}</span>
        </div>
        <FpFormRow
            v-for="row in view.rows"
            :key="row.key"
            plain
            compact
            inline
            class="min-h-13.25"
            :label="row.label"
            :description="row.changeNote ?? undefined">
            <template #leading>
                <FpIcon :name="row.icon" class="text-16 text-fg-3" />
            </template>
            <span v-if="row.fixed" class="flex items-center gap-1.5 pr-2.5 text-12.5 text-fg-3">
                <FpIcon :name="row.fixed === 'secret' ? 'icon-[lucide--lock-keyhole]' : 'icon-[lucide--search]'" class="text-13" />
                {{ row.fixed === 'secret' ? t('Always secret') : t('Always searchable') }}
            </span>
            <FpToggleGroup
                v-else
                size="sm"
                :model-value="row.mode"
                :items="view.modeItems"
                :aria-label="row.label"
                :disabled="view.locked"
                @update:model-value="view.setMode(row.key, $event)">
                <template #default="{ option }">
                    <FpIcon v-if="option.icon" :name="option.icon" class="text-13" />
                    {{ option.label }}
                </template>
            </FpToggleGroup>
        </FpFormRow>

        <FpAlert v-if="view.pending" color="warning" class="mt-3" :description="view.warning">
            <template #actions>
                <FpButton size="sm" variant="ghost" :label="t('Cancel')" @click="view.cancel" />
                <FpButton size="sm" color="accent" :label="view.applyLabel" @click="view.apply" />
            </template>
        </FpAlert>
        <div v-else-if="view.progress" class="mt-3 flex flex-col gap-2 rounded bg-surface-hi p-3.5">
            <div class="flex items-baseline gap-3 text-13">
                <span class="flex-1 font-medium text-fg-1">{{ view.progress.label }}</span>
                <span class="font-mono text-12 text-fg-3 tabular-nums">{{ view.progress.count }}</span>
            </div>
            <FpProgress :model-value="view.progress.value" size="sm" />
            <span class="text-12 text-fg-3">{{ t('Keep the app open. Search works with the old setup until this finishes.') }}</span>
        </div>
        <FpAlert v-else-if="view.interrupted" color="warning" class="mt-3" :description="t('Moving fields stopped before every account was done. Finish it to put the rest in place.')">
            <template #actions>
                <FpButton size="sm" color="accent" :label="t('Finish')" @click="view.finish" />
            </template>
        </FpAlert>
        <FpAlert v-else-if="view.done" color="success" class="mt-3" :description="view.done" />

        <SectionNote icon="icon-[lucide--info]" class="mt-3">
            {{ t('Searchable fields work in search and filters. Secret ones open only when shown. Folder vaults also choose which fields show up in Obsidian notes.') }}
        </SectionNote>
    </div>
</template>
