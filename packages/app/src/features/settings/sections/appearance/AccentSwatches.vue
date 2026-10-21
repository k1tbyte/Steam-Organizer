<script setup lang="ts">
import { ACCENT_PRESETS, FpTooltip } from '@so/ui'

const model = defineModel<string>({ required: true })
</script>

<template>
    <fieldset class="m-0 flex gap-3 border-0 p-0 pr-1">
        <FpTooltip v-for="(color, name) in ACCENT_PRESETS" :key="name" :text="color">
            <button
                type="button"
                :aria-label="name"
                :aria-pressed="model === color"
                class="swatch size-6 cursor-pointer rounded-full"
                :data-selected="model === color || undefined"
                :style="{ background: color }"
                @click="model = color" />
        </FpTooltip>
    </fieldset>
</template>

<style scoped>
.swatch {
    box-shadow:
        0 0 0 2px var(--surf-pop),
        0 0 0 4px transparent;
    transition: box-shadow var(--dur-fast) var(--ease-out);
}
.swatch[data-selected] {
    box-shadow:
        0 0 0 2px var(--surf-pop),
        0 0 0 4px var(--text-1);
}
</style>
