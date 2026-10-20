<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
    defineProps<{
        /** Filled fraction, 0 to 1. */
        value: number
        /** Diameter in px. */
        size?: number
        /** Ring width in px; 0 draws a filled pie. */
        thickness?: number
        tone?: 'accent' | 'success' | 'warning' | 'danger'
        /** Update interval in ms: the ring glides across it instead of stepping. */
        tick?: number
        label?: string
    }>(),
    { size: 16, thickness: 0, tone: 'accent' },
)

const style = computed(() => ({
    '--ring-p': `${Math.min(1, Math.max(0, props.value)) * 100}%`,
    '--ring-size': `${props.size}px`,
    '--ring-t': `${props.thickness}px`,
    '--ring-tick': `${props.tick ?? 0}ms`,
}))
</script>

<template>
    <span
        class="countdown"
        :class="tick ? 'countdown-glide' : undefined"
        :data-tone="tone"
        :data-hollow="thickness > 0 || undefined"
        :style="style"
        :role="label ? 'progressbar' : undefined"
        :aria-label="label"
        :aria-valuenow="label ? Math.round(value * 100) : undefined"
        :aria-hidden="label ? undefined : true">
        <span class="relative"><slot /></span>
    </span>
</template>

<style scoped>
@property --ring-p {
    syntax: '<percentage>';
    inherits: true;
    initial-value: 0%;
}
.countdown {
    position: relative;
    display: inline-grid;
    flex-shrink: 0;
    place-items: center;
    width: var(--ring-size);
    height: var(--ring-size);
}
.countdown::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: conic-gradient(var(--ring-tone) var(--ring-p), var(--stroke-2) 0);
}
.countdown-glide {
    transition: --ring-p var(--ring-tick) linear;
}
/* The hole is a mask on the arc alone, so the ring sits on any surface and the slot stays visible. */
.countdown[data-hollow]::before {
    mask: radial-gradient(
        circle farthest-side,
        transparent calc(100% - var(--ring-t)),
        var(--text-1) calc(100% - var(--ring-t) + 0.5px)
    );
}
[data-tone='accent'] {
    --ring-tone: var(--accent);
}
[data-tone='success'] {
    --ring-tone: var(--success);
}
[data-tone='warning'] {
    --ring-tone: var(--warning);
}
[data-tone='danger'] {
    --ring-tone: var(--danger);
}
</style>
