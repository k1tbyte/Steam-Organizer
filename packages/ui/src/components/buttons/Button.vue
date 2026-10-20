<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import type { SemanticColor } from '../../color'
import FpSpinner from '../feedback/Spinner.vue'
import { SQUARE_SIZES } from './sizes'

defineOptions({ inheritAttrs: false })

type Variant = 'solid' | 'soft' | 'outline' | 'ghost' | 'link' | 'scrim'
type Color = Extract<SemanticColor, 'accent' | 'neutral' | 'danger'>
type Size = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

const props = withDefaults(
    defineProps<{
        label?: string
        variant?: Variant
        color?: Color
        size?: Size
        square?: boolean
        round?: boolean
        block?: boolean
        loading?: boolean
        disabled?: boolean
        type?: 'button' | 'submit' | 'reset'
        as?: string | object
    }>(),
    {
        variant: 'solid',
        color: 'neutral',
        size: 'md',
        type: 'button',
        as: 'button',
    },
)

const isButton = computed(() => props.as === 'button')
const inactive = computed(() => Boolean(props.disabled || props.loading))
const attrs = useAttrs()

const forwardedAttrs = computed(() => {
    if (isButton.value || !inactive.value) return attrs
    return { ...attrs, 'aria-disabled': true, tabindex: -1 }
})

function preventInactive(event: MouseEvent) {
    if (!inactive.value) return
    event.preventDefault()
    event.stopImmediatePropagation()
}

// Heights are the mockup's: 32 compact, 34 toolbar, 36 dialog, 40 form row, 52 mobile primary.
// Text buttons match field heights on touch.
const SIZES: Record<Size, string> = {
    sm: 'h-8 px-3 text-13 touch-control-sm',
    md: 'h-8.5 px-3 text-13 touch-control-md',
    lg: 'h-9 px-4 text-13.5 touch-control-md',
    xl: 'h-10 px-4 text-14 touch-control-lg',
    '2xl': 'h-13 px-5 text-15',
}

const radius = computed(() => {
    if (props.round) return 'rounded-full'
    return props.square && props.size === 'sm' ? 'rounded-sm' : 'rounded'
})
</script>

<template>
    <!-- biome-ignore lint/a11y/noStaticElementInteractions: resolves to an interactive button or link -->
    <component
        :is="as"
        v-bind="forwardedAttrs"
        class="btn touch-target inline-flex items-center justify-center gap-1.5 whitespace-nowrap select-none disabled:pointer-events-none"
        :class="[
            square ? SQUARE_SIZES[size] : SIZES[size],
            block && 'w-full',
            radius,
            !isButton && inactive && 'cursor-not-allowed opacity-50',
        ]"
        :data-variant="variant"
        :data-color="color"
        :type="isButton ? type : undefined"
        :disabled="isButton ? inactive : undefined"
        :aria-busy="loading || undefined"
        @click.capture="preventInactive">
        <FpSpinner v-if="loading" size="sm" />
        <slot>{{ label }}</slot>
    </component>
</template>

<style scoped>
.btn {
    font-weight: 500;
    transition:
        background var(--dur-fast) var(--ease-out),
        color var(--dur-fast) var(--ease-out),
        box-shadow var(--dur-fast) var(--ease-out),
        transform var(--dur-base) var(--ease-spring);
}
/* Press lands at once; the release above springs back. */
.btn:active:not(:disabled):not([aria-disabled='true']) {
    transform: translateY(0.5px) scale(0.975);
    transition-duration: var(--dur-press);
    transition-timing-function: var(--ease-out);
}
/* A busy button keeps its face: only a real disable dims it. */
.btn:disabled:not([aria-busy]) {
    opacity: 0.5;
}

[data-color='accent'] {
    --btn-tone: var(--accent);
    --btn-tone-fg: var(--accent-fg);
    --btn-hover: var(--accent-hover);
    --btn-ink: var(--accent-ink);
    --btn-soft: var(--accent-soft);
}
[data-color='neutral'] {
    --btn-tone: var(--text-1);
    --btn-tone-fg: var(--bg-base);
    --btn-hover: color-mix(in oklch, var(--text-1) 88%, transparent);
    --btn-ink: var(--text-1);
    --btn-soft: var(--surf-bg-hi);
}
[data-color='danger'] {
    --btn-tone: var(--danger);
    --btn-tone-fg: var(--danger-fg);
    --btn-hover: oklch(from var(--danger) calc(l + 0.04) c h);
    --btn-ink: var(--danger);
    --btn-soft: var(--danger-soft);
}

[data-variant='solid'] {
    background: var(--btn-tone);
    color: var(--btn-tone-fg);
    font-weight: 600;
}
[data-variant='solid']:hover {
    background: var(--btn-hover);
}
/* A disabled primary reads as an empty control, not a dimmed one. */
[data-variant='solid']:disabled:not([aria-busy]) {
    background: var(--surf-bg-hi);
    color: var(--text-faint);
    opacity: 1;
}

[data-variant='soft'] {
    background: var(--btn-soft);
    color: var(--btn-ink);
}
[data-variant='soft']:hover {
    background: color-mix(in oklch, var(--btn-ink) 26%, transparent);
}
[data-variant='soft'][data-color='neutral']:hover {
    background: var(--hover-bg-hi);
}

[data-variant='outline'] {
    background: transparent;
    color: var(--text-2);
    box-shadow: inset 0 0 0 1px var(--stroke-2);
}
[data-variant='outline']:hover {
    background: var(--hover-bg);
    color: var(--text-1);
}
[data-variant='outline']:not([data-color='neutral']) {
    color: var(--btn-ink);
    box-shadow: inset 0 0 0 1px color-mix(in oklch, var(--btn-tone) 40%, transparent);
}

[data-variant='ghost'] {
    background: transparent;
    color: var(--btn-ink);
}
[data-variant='ghost'][data-color='neutral'] {
    color: var(--text-2);
}
[data-variant='ghost']:hover {
    background: var(--hover-bg);
    color: var(--text-1);
}
[data-variant='ghost'][data-color='danger']:hover {
    background: var(--danger-soft);
    color: var(--danger);
}

/* Over video or a thumbnail: the fill follows the media, not the theme, so color does not apply. */
[data-variant='scrim'] {
    background: var(--scrim-strong);
    color: var(--on-media);
}
[data-variant='scrim']:hover,
[data-variant='scrim']:active {
    background: color-mix(in oklch, var(--media) 85%, transparent);
}

/* Links sit in running text, so they keep the line's height on touch too. */
[data-variant='link'] {
    height: auto;
    padding: 0;
    min-height: 0;
    background: transparent;
    color: var(--btn-ink);
}
[data-variant='link'][data-color='neutral'] {
    color: var(--text-2);
}
[data-variant='link']:hover {
    color: var(--text-1);
}
</style>
