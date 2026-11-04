<script setup lang="ts">
import { FpButton, FpFormField, FpIcon, FpInput } from '@so/ui'
import { onMounted, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import type { Look, Picture } from '#core'

import { MAX_PRESET_NAME } from '../model'
import PresetPreview from './PresetPreview.vue'

/** A preset's name beside its preview: Save keeps the current look, Rename names a preset. */
defineProps<{
    look: Look
    image: Picture | null
    caption?: string
    submitLabel: string
    nameError: string | undefined
    canSubmit: boolean
}>()
const emit = defineEmits<{ submit: []; cancel: [] }>()
const draft = defineModel<string>({ required: true })

const { t } = useI18n()
const input = useTemplateRef('input')
onMounted(() => input.value?.focus())
</script>

<template>
    <div class="flex flex-col gap-3">
        <div class="flex items-start gap-3.5">
            <div class="flex w-28 shrink-0 flex-col gap-1.5">
                <PresetPreview :look :image />
                <span v-if="caption" class="text-11.5 text-fg-3">{{ caption }}</span>
            </div>
            <FpFormField :label="t('Preset name')" :error="nameError" class="min-w-0 flex-1">
                <FpInput
                    ref="input"
                    v-model="draft"
                    :maxlength="MAX_PRESET_NAME"
                    :placeholder="t('Name this look')"
                    @submit="emit('submit')"
                    @keydown.esc.prevent.stop="emit('cancel')">
                    <template #leading>
                        <FpIcon name="icon-[lucide--tag]" />
                    </template>
                </FpInput>
            </FpFormField>
        </div>
        <div class="flex justify-end gap-2 max-lg:grid max-lg:grid-cols-2">
            <FpButton variant="ghost" :label="t('Cancel')" @click="emit('cancel')" />
            <FpButton color="accent" variant="solid" :label="submitLabel" :disabled="!canSubmit" @click="emit('submit')" />
        </div>
    </div>
</template>
