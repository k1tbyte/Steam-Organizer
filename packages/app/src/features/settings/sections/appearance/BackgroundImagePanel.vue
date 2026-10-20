<script setup lang="ts">
import { FpButton, FpIcon, FpSlider } from '@so/ui'
import { useI18n } from 'vue-i18n'

defineProps<{
    name: string
    hasCustomImage: boolean
    suggestGlass: boolean
}>()
const blur = defineModel<number>('blur', { required: true })
const dim = defineModel<number>('dim', { required: true })
defineEmits<{ upload: []; useSample: []; useGlass: [] }>()

const { t } = useI18n()
</script>

<template>
    <div class="flex flex-col gap-3 rounded bg-surface-hi px-3.5 py-3">
        <div class="flex items-center gap-2">
            <FpIcon name="icon-[lucide--image]" class="text-15 text-fg-3" />
            <span class="min-w-0 flex-1 truncate text-13 text-fg-1">{{ name }}</span>
            <FpButton v-if="hasCustomImage" size="sm" variant="ghost" @click="$emit('useSample')">
                {{ t('Use sample') }}
            </FpButton>
            <FpButton size="sm" variant="outline" @click="$emit('upload')">
                <FpIcon name="icon-[lucide--upload]" class="text-13" />
                {{ t('Upload image…') }}
            </FpButton>
        </div>
        <div class="grid grid-cols-[3rem_minmax(0,1fr)_3rem] items-center gap-3">
            <span class="text-12.5 text-fg-2">{{ t('Blur') }}</span>
            <FpSlider v-model="blur" :min="0" :max="60" :step="2" size="xs" :label="t('Blur')" />
            <span class="text-right font-medium font-mono text-12 text-fg-2">{{ t('{value}px', { value: blur }) }}</span>
        </div>
        <div class="grid grid-cols-[3rem_minmax(0,1fr)_3rem] items-center gap-3">
            <span class="text-12.5 text-fg-2">{{ t('Dim') }}</span>
            <FpSlider v-model="dim" :min="0" :max="85" :step="5" size="xs" :label="t('Dim')" />
            <span class="text-right font-medium font-mono text-12 text-fg-2">{{ dim }}%</span>
        </div>
        <div
            v-if="suggestGlass"
            class="flex items-center gap-2 border-stroke-1 border-t border-dashed pt-2.5 text-12.5 text-fg-3">
            <span class="flex-1">{{ t('Cards read best on images with the Glass surface') }}</span>
            <FpButton size="sm" variant="ghost" color="accent" @click="$emit('useGlass')">
                {{ t('Use Glass') }}
            </FpButton>
        </div>
        <span class="text-12 text-fg-3">
            {{ t('Stays on this device. Not synced or saved in the vault.') }}
        </span>
    </div>
</template>
