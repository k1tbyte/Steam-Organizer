<script setup lang="ts">
import {
    FpButton,
    FpDot,
    FpDropdownMenu,
    FpFormField,
    FpIcon,
    FpInput,
    FpSpinner,
    type MenuEntries,
    tip,
} from '@so/ui'
import { useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { MAX_PRESET_NAME, type Preset } from '../model'
import type { PictureStatus } from '../services/pictureSync'
import PresetPreview from './PresetPreview.vue'

const props = defineProps<{
    preset: Preset
    on: boolean
    modified: boolean
    menu: MenuEntries | null
    /** Its name edited in place (desktop). */
    renaming: boolean
    nameError: string | undefined
    canSubmit: boolean
    picture: { kind: PictureStatus; text: string } | null
}>()

const PICTURE_ICONS = {
    waiting: 'icon-[lucide--cloud-upload]',
    offline: 'icon-[lucide--cloud-off]',
    missing: 'icon-[lucide--image-off]',
}
const PICTURE_TONES = {
    loading: 'text-fg-3',
    waiting: 'text-fg-3',
    offline: 'text-warning',
    missing: 'text-danger',
}
const emit = defineEmits<{ apply: [event: MouseEvent]; submit: []; cancel: [] }>()
const draft = defineModel<string>('draft', { required: true })

const { t } = useI18n()
const field = useTemplateRef('field')
watch(
    () => props.renaming,
    (renaming) => renaming && field.value?.focus(),
    { flush: 'post' },
)
</script>

<template>
    <div
        class="flex flex-col gap-1.75 rounded px-1.5 pt-1.5 pb-2 ring-inset"
        :class="on ? 'ring-2 ring-accent' : modified ? 'ring-2 ring-accent/40' : 'ring-1 ring-stroke-1'">
        <button
            type="button"
            class="relative block cursor-pointer text-left"
            :aria-label="t('Apply {name}', { name: preset.name })"
            @click="emit('apply', $event)">
            <PresetPreview :look="preset.look" :image="preset.image" />
            <span
                v-if="on"
                class="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full bg-accent text-12 text-accent-fg">
                <FpIcon name="icon-[lucide--check]" />
            </span>
            <span
                v-else-if="modified"
                class="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full bg-surface-pop ring-1 ring-stroke-2 ring-inset">
                <FpDot color="warning" />
            </span>
        </button>
        <FpFormField v-if="renaming" :error="nameError">
            <FpInput
                ref="field"
                v-model="draft"
                size="sm"
                :maxlength="MAX_PRESET_NAME"
                :aria-label="t('Preset name')"
                @submit="emit('submit')"
                @keydown.esc.prevent.stop="emit('cancel')">
                <template #trailing>
                    <FpButton
                        v-bind="tip(t('Save'), { label: true })"
                        square
                        size="xs"
                        variant="ghost"
                        :disabled="!canSubmit"
                        @click="emit('submit')">
                        <FpIcon name="icon-[lucide--check]" />
                    </FpButton>
                    <FpButton v-bind="tip(t('Cancel'), { label: true })" square size="xs" variant="ghost" @click="emit('cancel')">
                        <FpIcon name="icon-[lucide--x]" />
                    </FpButton>
                </template>
            </FpInput>
        </FpFormField>
        <div v-else class="flex min-h-7 items-center gap-0.5 pl-1">
            <span class="min-w-0 flex-1 truncate font-medium text-13 text-fg-1">{{ preset.name }}</span>
            <FpDropdownMenu v-if="menu" :items="menu" placement="bottom-end">
                <FpButton v-bind="tip(t('Preset actions'), { label: true })" square size="xs" variant="ghost" class="text-fg-3!">
                    <FpIcon name="icon-[lucide--ellipsis]" />
                </FpButton>
            </FpDropdownMenu>
        </div>
        <span
            v-if="picture"
            class="flex items-start gap-1.5 px-1 text-11.5"
            :class="PICTURE_TONES[picture.kind]">
            <FpSpinner v-if="picture.kind === 'loading'" size="sm" class="shrink-0" />
            <FpIcon v-else :name="PICTURE_ICONS[picture.kind]" class="mt-px shrink-0" />
            <span class="line-clamp-2 text-fg-3">{{ picture.text }}</span>
        </span>
    </div>
</template>
