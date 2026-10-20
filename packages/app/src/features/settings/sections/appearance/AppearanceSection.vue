<script setup lang="ts">
import { FpFormRow, FpIcon, FpSlider, FpSwitch, FpToggleGroup } from '@so/ui'
import { useI18n } from 'vue-i18n'

import AccentSwatches from './AccentSwatches.vue'
import BackgroundImagePanel from './BackgroundImagePanel.vue'
import PreviewChoices from './PreviewChoices.vue'
import { useAppearanceSection } from './useAppearanceSection'

const { t } = useI18n()
const view = useAppearanceSection()
</script>

<template>
    <div>
        <FpFormRow plain :label="t('Theme')" :description="t('System follows the OS setting')">
            <FpToggleGroup
                :model-value="view.mode.value"
                :items="view.modeItems.value"
                :aria-label="t('Theme')"
                @pointerdown.capture="view.rememberPress"
                @update:model-value="view.setMode">
                <template #default="{ option }">
                    <FpIcon v-if="option.icon" :name="option.icon" class="text-14" />
                    {{ option.label }}
                </template>
            </FpToggleGroup>
        </FpFormRow>
        <FpFormRow plain :label="t('Accent')" :description="t('Buttons, selection, level ring progress')">
            <AccentSwatches
                :aria-label="t('Accent')"
                :model-value="view.accent.value"
                @update:model-value="view.setAccent" />
        </FpFormRow>
        <FpFormRow
            plain
            :label="t('Tint backgrounds')"
            :description="t('A trace of the accent in dark surfaces')">
            <FpSwitch
                :model-value="view.tintOn.value"
                :aria-label="t('Tint backgrounds')"
                @update:model-value="view.setTint" />
        </FpFormRow>
        <FpFormRow
            plain
            stacked
            :label="t('Surface')"
            :description="t('How cards and panels sit on the background')">
            <PreviewChoices
                kind="surface"
                :options="view.surfaceItems.value"
                :model-value="view.surface.value"
                @update:model-value="view.setSurface" />
        </FpFormRow>
        <FpFormRow plain stacked :label="t('Background')" :description="t('Behind the app window')">
            <PreviewChoices
                kind="background"
                :options="view.backgroundItems.value"
                :model-value="view.background.value"
                @update:model-value="view.setBackground" />
            <BackgroundImagePanel
                v-if="view.isImage.value"
                :blur="view.image.blur.value"
                :dim="view.image.dim.value"
                :name="view.imageName.value"
                :has-custom-image="view.hasCustomImage.value"
                :suggest-glass="view.suggestGlass.value"
                @update:blur="view.image.setBlur"
                @update:dim="view.image.setDim"
                @upload="view.pickImage"
                @use-sample="view.image.resetToSample"
                @use-glass="view.setSurface('glass')" />
        </FpFormRow>
        <FpFormRow plain :label="t('Corner radius')" :description="t('Cards, buttons and windows')">
            <div class="flex w-60 items-center gap-3">
                <FpSlider
                    :model-value="view.radiusPx.value"
                    :min="0"
                    :max="24"
                    :step="2"
                    size="xs"
                    :label="t('Corner radius')"
                    @update:model-value="view.setRadius($event as number)" />
                <span class="w-11 text-right font-medium font-mono text-12.5 text-fg-2">
                    {{ t('{value}px', { value: view.radiusPx.value }) }}
                </span>
            </div>
        </FpFormRow>
        <FpFormRow plain :label="t('Density')" :description="t('Spacing in cards and lists')">
            <FpToggleGroup
                :model-value="view.density.value"
                :items="view.densityItems.value"
                :aria-label="t('Density')"
                @update:model-value="view.setDensity" />
        </FpFormRow>
        <FpFormRow
            plain
            :label="t('Reduce motion')"
            :description="t('Fewer animations and no theme reveal')">
            <FpSwitch
                :model-value="view.motionReduced.value"
                :aria-label="t('Reduce motion')"
                @update:model-value="view.setMotionReduced" />
        </FpFormRow>
        <FpFormRow plain :label="t('Language')">
            <FpToggleGroup
                :model-value="view.language.value"
                :items="view.languageItems"
                :aria-label="t('Language')"
                @update:model-value="view.setLanguage" />
        </FpFormRow>
    </div>
</template>
