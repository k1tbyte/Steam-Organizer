<script setup lang="ts">
import type { Look, Picture } from '#core'

import { usePresetPreview } from '../composables/usePresetPreview'

const props = defineProps<{ look: Look; image: Picture | null }>()
const { mode, picture, vars } = usePresetPreview(props)
</script>

<template>
    <span
        class="preview"
        :data-mode="mode"
        :data-tint="look.tint"
        :data-surface="look.surface"
        :data-bg="look.background"
        :style="vars">
        <template v-if="picture">
            <span class="picture" />
            <span class="dim" />
        </template>
        <span class="window">
            <span class="flex items-center gap-1.25">
                <span class="dot" />
                <span class="line w-[38%] bg-(--pv-tx1)" />
            </span>
            <span class="line w-[88%]" />
            <span class="line w-[62%]" />
            <span class="button" />
        </span>
    </span>
</template>

<style scoped>
.preview {
    --pv-ink: var(--on-media);
    --pv-chroma: min(calc(c * 0.25), 0.035);
    --pv-bg: oklch(from var(--pv-accent) 0.155 var(--pv-chroma) h);
    --pv-win: oklch(from var(--pv-accent) 0.22 var(--pv-chroma) h);
    --pv-ring: color-mix(in oklch, var(--pv-ink) 9%, transparent);
    --pv-tx1: color-mix(in oklch, var(--pv-ink) 62%, transparent);
    --pv-tx2: color-mix(in oklch, var(--pv-ink) 28%, transparent);
    --pv-dots: color-mix(in oklch, var(--pv-ink) 11%, transparent);
    --pv-line: color-mix(in oklch, var(--pv-ink) 8%, transparent);
    --pv-blob: 1;
    position: relative;
    display: block;
    overflow: hidden;
    aspect-ratio: 16 / 9;
    border-radius: var(--radius-sm);
    background: var(--pv-bg);
}
.preview::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: inset 0 0 0 1px var(--stroke-1);
    pointer-events: none;
}
.preview[data-mode='light'] {
    --pv-ink: var(--media);
    --pv-chroma: min(calc(c * 0.06), 0.008);
    --pv-bg: oklch(from var(--pv-accent) 0.978 var(--pv-chroma) h);
    --pv-win: var(--on-media);
    --pv-tx1: color-mix(in oklch, var(--pv-ink) 56%, transparent);
    --pv-tx2: color-mix(in oklch, var(--pv-ink) 22%, transparent);
    --pv-dots: color-mix(in oklch, var(--pv-ink) 13%, transparent);
    --pv-line: color-mix(in oklch, var(--pv-ink) 9%, transparent);
    --pv-blob: 0.6;
}
.preview[data-tint='off'] {
    --pv-chroma: 0;
}
.preview[data-surface='subtle'] {
    --pv-win: color-mix(in oklch, var(--pv-ink) 5%, transparent);
    --pv-ring: color-mix(in oklch, var(--pv-ink) 11%, transparent);
}
.preview[data-mode='light'][data-surface='subtle'] {
    --pv-win: color-mix(in oklch, var(--pv-ink) 3%, transparent);
    --pv-ring: color-mix(in oklch, var(--pv-ink) 8%, transparent);
}
.preview[data-surface='glass'] {
    --pv-win: color-mix(in oklch, var(--pv-ink) 8%, transparent);
    --pv-ring: color-mix(in oklch, var(--pv-ink) 16%, transparent);
}
.preview[data-mode='light'][data-surface='glass'] {
    --pv-win: color-mix(in oklch, var(--on-media) 62%, transparent);
    --pv-ring: color-mix(in oklch, var(--pv-ink) 9%, transparent);
}
.preview[data-bg='clean'] {
    background:
        radial-gradient(circle, var(--pv-dots) 1px, transparent 1.5px) 0 0 / 9px 9px,
        radial-gradient(
            ellipse 80% 60% at 50% 0%,
            color-mix(in oklch, var(--pv-accent) calc(10% * var(--pv-blob)), transparent),
            transparent 70%
        ),
        var(--pv-bg);
}
.preview[data-bg='noisy'] {
    background:
        radial-gradient(circle, var(--pv-dots) 1px, transparent 1.5px) 0 0 / 9px 9px,
        radial-gradient(
            ellipse 60% 50% at 20% 10%,
            color-mix(in oklch, var(--pv-accent) calc(28% * var(--pv-blob)), transparent),
            transparent 70%
        ),
        radial-gradient(
            ellipse 55% 45% at 85% 80%,
            color-mix(in oklch, var(--pv-accent) calc(22% * var(--pv-blob)), transparent),
            transparent 70%
        ),
        radial-gradient(
            ellipse 40% 40% at 60% 50%,
            color-mix(in oklch, var(--pv-accent) calc(12% * var(--pv-blob)), transparent),
            transparent 70%
        ),
        var(--pv-bg);
}
.preview[data-bg='grid'] {
    background:
        linear-gradient(var(--pv-line) 1px, transparent 1px) -1px -1px / 11px 11px,
        linear-gradient(90deg, var(--pv-line) 1px, transparent 1px) -1px -1px / 11px 11px,
        radial-gradient(
            ellipse 80% 60% at 50% 0%,
            color-mix(in oklch, var(--pv-accent) calc(8% * var(--pv-blob)), transparent),
            transparent 70%
        ),
        var(--pv-bg);
}
.picture {
    position: absolute;
    inset: -0.75rem;
    background: var(--pv-pic) center / cover;
    filter: blur(var(--pv-picblur));
}
.dim {
    position: absolute;
    inset: 0;
    background: color-mix(in oklch, var(--pv-bg) var(--pv-dim), transparent);
}
.window {
    position: absolute;
    inset: 30% 12% -16%;
    display: flex;
    flex-direction: column;
    gap: var(--pv-gap);
    padding: 0.5rem 0.5625rem;
    border-radius: var(--pv-r);
    background: var(--pv-win);
    box-shadow: inset 0 0 0 1px var(--pv-ring);
}
.dot {
    width: 0.375rem;
    height: 0.375rem;
    flex-shrink: 0;
    border-radius: 999px;
    background: var(--pv-accent);
}
.line {
    height: 0.25rem;
    border-radius: 999px;
    background: var(--pv-tx2);
}
.button {
    width: 34%;
    height: 0.5625rem;
    margin-top: 2px;
    border-radius: var(--pv-pr);
    background: var(--pv-accent);
}
</style>
