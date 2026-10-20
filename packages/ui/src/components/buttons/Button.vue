<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import type { SemanticColor } from '../../color'
import FpSpinner from '../feedback/Spinner.vue'
import { SQUARE_SIZES } from './sizes'

defineOptions({ inheritAttrs: false })

type Variant = 'solid' | 'soft' | 'outline' | 'ghost' | 'link' | 'scrim'
type Color = Extract<SemanticColor, 'accent' | 'neutral' | 'danger'>
type Size = 'sm' | 'md' | 'lg' | 'xl'

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

// Text buttons match field heights on touch.
const SIZES: Record<Size, string> = {
    sm: 'px-3 py-1.5 text-xs touch-control-sm',
    md: 'px-4 py-2 text-sm touch-control-md',
    lg: 'px-5 py-2.5 text-base touch-control-lg',
    xl: 'px-6 py-3.5 text-lg',
}
</script>

<template>
    <!-- biome-ignore lint/a11y/noStaticElementInteractions: resolves to an interactive button or link -->
    <component
        :is="as"
        v-bind="forwardedAttrs"
        class="btn touch-target inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap select-none disabled:pointer-events-none disabled:opacity-50"
        :class="[
            square ? SQUARE_SIZES[size] : SIZES[size],
            block && 'w-full',
            round ? 'rounded-full' : 'rounded',
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

[data-color='accent'] {
    --btn-tone: var(--accent);
    --btn-tone-fg: var(--accent-fg);
    --btn-glow: var(--accent-glow);
}
[data-color='neutral'] {
    --btn-tone: var(--text-1);
    --btn-tone-fg: var(--bg-base);
    --btn-glow: transparent;
}
[data-color='danger'] {
    --btn-tone: var(--danger);
    --btn-tone-fg: var(--danger-fg);
    --btn-glow: color-mix(in oklch, var(--danger) 50%, transparent);
}

[data-variant='solid'] {
    background: var(--btn-tone);
    color: var(--btn-tone-fg);
    box-shadow:
        0 1px 0 color-mix(in oklch, white 22%, transparent) inset,
        0 6px 20px -8px var(--btn-glow);
}
[data-variant='solid']:hover {
    background: oklch(from var(--btn-tone) calc(l + 0.04) c h);
}
[data-variant='solid']:active {
    background: oklch(from var(--btn-tone) calc(l - 0.02) c h);
}

[data-variant='soft'] {
    background: color-mix(in oklch, var(--btn-tone) 16%, transparent);
    color: var(--btn-tone);
    box-shadow: 0 0 0 1px color-mix(in oklch, var(--btn-tone) 25%, transparent);
}
[data-variant='soft']:hover {
    background: color-mix(in oklch, var(--btn-tone) 26%, transparent);
}

[data-variant='soft'][data-color='neutral'] {
    background: var(--surf-bg-hi);
    color: var(--text-1);
    box-shadow:
        0 0 0 1px var(--stroke-2),
        0 1px 0 color-mix(in oklch, white 10%, transparent) inset;
}
[data-variant='soft'][data-color='neutral']:hover {
    background: var(--surf-bg-hi);
    box-shadow:
        0 0 0 1px var(--stroke-3),
        0 1px 0 color-mix(in oklch, white 14%, transparent) inset;
}

[data-variant='outline'] {
    background: var(--surf-bg-hi);
    color: var(--text-1);
    box-shadow:
        0 0 0 1px var(--stroke-2),
        0 1px 0 color-mix(in oklch, white 10%, transparent) inset;
}
[data-variant='outline']:hover {
    box-shadow:
        0 0 0 1px var(--stroke-3),
        0 1px 0 color-mix(in oklch, white 14%, transparent) inset;
}
[data-variant='outline']:not([data-color='neutral']) {
    color: var(--btn-tone);
    box-shadow: 0 0 0 1px color-mix(in oklch, var(--btn-tone) 40%, transparent);
}

[data-variant='ghost'] {
    background: transparent;
    color: var(--btn-tone);
}
[data-variant='ghost'][data-color='neutral'] {
    color: var(--text-1);
}
[data-variant='ghost']:hover {
    background: color-mix(in oklch, var(--btn-tone) 12%, transparent);
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
    padding: 0;
    min-height: 0;
    background: transparent;
    color: var(--btn-tone);
    text-underline-offset: 4px;
}
[data-variant='link'][data-color='neutral'] {
    color: var(--text-2);
}
[data-variant='link']:hover {
    text-decoration: underline;
}
</style>
