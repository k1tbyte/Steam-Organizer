<script setup lang="ts">
import { FpButton, FpIcon, FpLabel, FpPopover, FpSelect } from '@so/ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { type MockMode, useMockControls } from '#core'

const { t } = useI18n()
const { enabled, mode, mocks, pickOf, pick } = useMockControls()

const modes = computed<{ value: MockMode; label: string }[]>(() => [
    { value: 'live', label: t('Live data') },
    { value: 'fill', label: t('Fill gaps with mocks') },
    { value: 'mock', label: t('Mocks everywhere') },
])
const modeLabel = computed(
    () => modes.value.find((option) => option.value === mode.value)?.label,
)
</script>

<!-- Design-first scaffolding: goes away with core/mock. -->
<template>
    <FpPopover
        v-if="enabled && mocks.length > 0"
        sheet
        :label="t('Mock data')"
        placement="top-end"
        width="min(92vw, 20rem)"
        max-height="min(36rem, calc(100svh - 6rem))">
        <FpButton
            size="sm"
            round
            variant="soft"
            color="accent"
            class="fixed right-3 bottom-3 layer-float">
            <FpIcon name="icon-[lucide--flask-conical]" aria-hidden="true" />
            {{ modeLabel }}
        </FpButton>

        <template #content>
            <div class="flex flex-col gap-3">
                <div class="flex flex-col gap-1.5">
                    <FpLabel>{{ t('Mode') }}</FpLabel>
                    <FpSelect v-model="mode" :items="modes" size="sm" />
                </div>
                <div
                    v-for="mock in mocks"
                    :key="mock.key"
                    class="flex flex-col gap-1.5">
                    <FpLabel>{{ mock.label }}</FpLabel>
                    <FpSelect
                        :items="Object.keys(mock.variants)"
                        :model-value="pickOf(mock)"
                        size="sm"
                        @update:model-value="pick(mock.key, $event)" />
                </div>
            </div>
        </template>
    </FpPopover>
</template>
