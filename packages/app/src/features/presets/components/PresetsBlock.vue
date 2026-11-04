<script setup lang="ts">
import { FpButton, FpDrawer, FpFormRow, FpIcon, useDesktopLayout } from '@so/ui'
import { useI18n } from 'vue-i18n'

import { usePresetsBlock } from '../composables/usePresetsBlock'
import FollowStrip from './FollowStrip.vue'
import PresetNameForm from './PresetNameForm.vue'
import PresetTile from './PresetTile.vue'

const { t } = useI18n()
const view = usePresetsBlock()
const desktop = useDesktopLayout()
</script>

<template>
    <div class="flex flex-col gap-3 pb-3.5">
        <FpFormRow
            plain
            :label="t('Presets')"
            :description="t('Named looks, shared by every device of this vault. Language and motion stay on each device.')">
            <FpButton
                variant="soft"
                size="sm"
                class="max-lg:w-full"
                @click="view.saving.value ? view.cancel() : view.startSave()">
                <FpIcon name="icon-[lucide--plus]" />
                {{ t('Save current as preset') }}
            </FpButton>
        </FpFormRow>
        <div v-if="desktop && view.saving.value" class="rounded bg-surface-hi p-3.5">
            <PresetNameForm
                v-model="view.draft.value"
                :look="view.current.value.look"
                :image="view.current.value.image"
                :caption="t('Current look')"
                :note="view.saveNote.value"
                :submit-label="t('Save')"
                :name-error="view.nameError.value"
                :can-submit="view.canSubmit.value"
                @submit="view.submit"
                @cancel="view.cancel" />
        </div>
        <div class="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            <PresetTile
                v-for="tile in view.tiles.value"
                :key="tile.preset.id"
                v-model:draft="view.draft.value"
                :preset="tile.preset"
                :on="tile.on"
                :modified="tile.modified"
                :menu="tile.menu"
                :renaming="desktop && tile.renaming"
                :name-error="view.nameError.value"
                :can-submit="view.canSubmit.value"
                :picture="tile.picture"
                @apply="view.apply(tile.preset, $event)"
                @submit="view.submit"
                @cancel="view.cancel" />
        </div>
        <FollowStrip
            v-if="view.strip.value"
            :name="view.strip.value.name"
            :modified="view.strip.value.modified"
            :can-update="view.strip.value.canUpdate"
            :note="view.strip.value.note"
            @update="view.updateFollowed"
            @save-new="view.startSave"
            @revert="view.revert" />
        <FpDrawer
            v-if="!desktop"
            :open="view.sheet.value !== null"
            :title="view.sheet.value?.title ?? ''"
            @update:open="!$event && view.cancel()">
            <PresetNameForm
                v-if="view.sheet.value"
                v-model="view.draft.value"
                :look="view.sheet.value.look"
                :image="view.sheet.value.image"
                :caption="view.sheet.value.caption"
                :note="view.sheet.value.note"
                :submit-label="view.sheet.value.submit"
                :name-error="view.nameError.value"
                :can-submit="view.canSubmit.value"
                @submit="view.submit"
                @cancel="view.cancel" />
        </FpDrawer>
    </div>
</template>
