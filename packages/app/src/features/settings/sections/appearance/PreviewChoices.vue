<script setup lang="ts" generic="T extends string">
import { FpChoice, FpChoiceGroup, FpIcon } from '@so/ui'

defineProps<{
    kind: 'surface' | 'background'
    options: { value: T; label: string; icon?: string }[]
}>()

const model = defineModel<T>({ required: true })
</script>

<template>
    <FpChoiceGroup
        v-model="model"
        orientation="horizontal"
        class="grid"
        :class="kind === 'surface' ? 'grid-cols-3 gap-2.5' : 'grid-cols-5 gap-2'">
        <FpChoice
            v-for="option in options"
            :key="option.value"
            :value="option.value"
            class="flex flex-col gap-2 px-1.5 pt-1.5 pb-2.25">
            <span class="preview" :data-kind="kind" :data-value="option.value">
                <span v-if="kind === 'surface'" class="preview-card" />
            </span>
            <span class="flex items-center gap-1.25 px-1 font-medium text-13 text-fg-1">
                <FpIcon v-if="option.icon" :name="option.icon" class="text-13 text-fg-3" />
                {{ option.label }}
            </span>
        </FpChoice>
    </FpChoiceGroup>
</template>

<style scoped>
.preview {
    position: relative;
    display: block;
    overflow: hidden;
    border-radius: var(--radius-sm);
    background-color: var(--bg-base);
}
.preview[data-kind='background'] {
    height: 3.25rem;
    box-shadow: inset 0 0 0 1px var(--stroke-1);
}
.preview[data-kind='surface'] {
    height: 4.25rem;
    background-image:
        radial-gradient(
            ellipse 70% 80% at 25% 20%,
            color-mix(in oklch, var(--accent) 45%, transparent),
            transparent 70%
        ),
        radial-gradient(
            ellipse 60% 70% at 85% 90%,
            color-mix(in oklch, var(--accent) 30%, transparent),
            transparent 70%
        );
}
.preview-card {
    position: absolute;
    inset: 1rem 0.875rem -0.5rem;
    border-radius: var(--radius-xs);
    box-shadow: inset 0 0 0 1px var(--stroke-1);
}
[data-value='flat'] .preview-card {
    background: color-mix(in oklch, var(--text-1) 9%, var(--bg-base));
}
[data-value='subtle'] .preview-card {
    background: color-mix(in oklch, var(--text-1) 6%, transparent);
    backdrop-filter: blur(6px);
}
[data-value='glass'] .preview-card {
    background: color-mix(in oklch, var(--text-1) 12%, transparent);
    backdrop-filter: blur(16px) saturate(160%);
    box-shadow: inset 0 0 0 1px var(--stroke-2);
}

[data-value='clean'] {
    background-image:
        radial-gradient(
            circle,
            color-mix(in oklch, var(--text-1) 14%, transparent) 1px,
            transparent 1.5px
        ),
        radial-gradient(
            ellipse 80% 70% at 50% 0%,
            color-mix(in oklch, var(--accent) 22%, transparent),
            transparent 70%
        );
    background-size: 10px 10px, auto;
}
[data-value='noisy'] {
    background-image:
        radial-gradient(
            circle,
            color-mix(in oklch, var(--text-1) 14%, transparent) 1px,
            transparent 1.5px
        ),
        radial-gradient(
            ellipse 60% 70% at 20% 10%,
            color-mix(in oklch, var(--accent) 45%, transparent),
            transparent 70%
        ),
        radial-gradient(
            ellipse 55% 60% at 85% 85%,
            color-mix(in oklch, var(--accent) 35%, transparent),
            transparent 70%
        );
    background-size: 10px 10px, auto, auto;
}
[data-value='grid'] {
    background-image:
        linear-gradient(color-mix(in oklch, var(--text-1) 9%, transparent) 1px, transparent 1px),
        linear-gradient(90deg, color-mix(in oklch, var(--text-1) 9%, transparent) 1px, transparent 1px),
        radial-gradient(
            ellipse 80% 70% at 50% 0%,
            color-mix(in oklch, var(--accent) 12%, transparent),
            transparent 70%
        );
    background-size: 12px 12px, 12px 12px, auto;
    background-position: -1px -1px, -1px -1px, 0 0;
}
[data-value='image'] {
    background: var(--stage-image, var(--surf-bg-hi)) center / cover;
}
</style>
