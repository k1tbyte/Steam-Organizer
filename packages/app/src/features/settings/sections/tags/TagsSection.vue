<script setup lang="ts">
import { FpButton, FpCard, FpConfirmModal, FpIcon, FpPopover, tip } from '@so/ui'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

import { MAX_TAG_LENGTH, TagSwatches } from '#features/accounts'

import NameField from '../../components/NameField.vue'
import { useTagsSection } from './useTagsSection'

const { t } = useI18n()
const view = reactive(useTagsSection())
</script>

<template>
    <div>
        <div class="flex items-center gap-3 pt-1.5 pb-3">
            <span class="flex-1 text-13 text-fg-3">{{ view.summary }}</span>
            <FpButton size="sm" variant="soft" @click="view.start('new')">
                <FpIcon name="icon-[lucide--plus]" />
                {{ t('New tag') }}
            </FpButton>
        </div>
        <FpCard flush class="divide-y divide-stroke-1">
            <div v-if="view.adding" class="flex min-h-12 items-center gap-3 bg-hover px-4 py-2">
                <span class="grid size-5 shrink-0 place-items-center">
                    <span class="tag-dot size-2.5 rounded-full" :style="{ '--hue': view.newHue }" />
                </span>
                <NameField
                    v-model="view.draft"
                    :maxlength="MAX_TAG_LENGTH"
                    :label="t('Tag name')"
                    :message="view.error"
                    @save="view.save"
                    @cancel="view.cancel"
                    @leave="view.leave" />
            </div>
            <div
                v-for="row in view.rows"
                :key="row.id"
                class="flex min-h-12 items-center gap-3 px-4 py-2"
                :class="row.editing && 'bg-hover'">
                <FpPopover placement="bottom-start" width="auto" :label="t('Color')">
                    <button
                        v-bind="tip(t('Color'), { label: true })"
                        type="button"
                        class="touch-target grid size-5 shrink-0 cursor-pointer place-items-center rounded-full hover:bg-hover">
                        <span class="tag-dot size-2.5 rounded-full" :style="{ '--hue': row.hue }" />
                    </button>
                    <template #content="{ close }">
                        <TagSwatches
                            :swatches="row.swatches"
                            @pick="
                                (hue) => {
                                    view.recolor(row.id, hue)
                                    close()
                                }
                            " />
                    </template>
                </FpPopover>
                <NameField
                    v-if="row.editing"
                    v-model="view.draft"
                    :maxlength="MAX_TAG_LENGTH"
                    :label="t('Tag name')"
                    :message="view.error"
                    @save="view.save"
                    @cancel="view.cancel"
                    @leave="view.leave" />
                <button
                    v-else
                    type="button"
                    class="min-w-0 flex-1 cursor-pointer truncate text-left text-13.5 text-fg-1"
                    @click="view.start(row.id)">
                    {{ row.label }}
                </button>
                <span class="shrink-0 font-mono text-12 text-fg-3">{{ row.count }}</span>
                <FpButton
                    v-bind="tip(t('Rename'), { label: true })"
                    square
                    size="xs"
                    variant="ghost"
                    class="shrink-0 text-fg-3!"
                    @click="view.start(row.id)">
                    <FpIcon name="icon-[lucide--pencil]" />
                </FpButton>
                <FpButton
                    v-bind="tip(t('Delete'), { label: true })"
                    square
                    size="xs"
                    variant="ghost"
                    class="shrink-0 text-fg-3!"
                    @click="view.removal.ask(row)">
                    <FpIcon name="icon-[lucide--trash-2]" />
                </FpButton>
            </div>
            <p v-if="view.empty" class="px-4 py-6 text-center text-13 text-fg-3">
                {{ t('No tags yet. Make one here, or from a card or a profile.') }}
            </p>
        </FpCard>
        <FpConfirmModal
            v-model:open="view.removal.open"
            :title="view.removal.title"
            :description="view.removal.note"
            :confirm-label="t('Delete tag')"
            :cancel-label="t('Cancel')"
            confirm-color="danger"
            @confirm="view.removal.confirm" />
    </div>
</template>
