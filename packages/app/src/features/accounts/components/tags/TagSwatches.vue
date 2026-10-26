<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{ swatches: readonly { hue: number; name: string; picked: boolean }[] }>()
const emit = defineEmits<{ pick: [hue: number] }>()

const { t } = useI18n()
</script>

<template>
    <fieldset class="flex items-center gap-2.25">
        <legend class="sr-only">{{ t('Color') }}</legend>
        <button
            v-for="swatch in swatches"
            :key="swatch.hue"
            type="button"
            :aria-pressed="swatch.picked"
            :aria-label="swatch.name"
            class="swatch tag-dot touch-target size-4 cursor-pointer rounded-full"
            :style="{ '--hue': swatch.hue }"
            @click="emit('pick', swatch.hue)" />
    </fieldset>
</template>

<style scoped>
.swatch {
    box-shadow: 0 0 0 2px var(--surf-pop);
    transition: box-shadow var(--dur-fast) var(--ease-out);
}
.swatch[aria-pressed='true'] {
    box-shadow:
        0 0 0 2px var(--surf-pop),
        0 0 0 3.5px var(--text-1);
}
</style>
