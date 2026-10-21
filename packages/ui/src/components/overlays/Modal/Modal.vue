<script setup lang="ts">
import {
    DialogContent,
    DialogDescription,
    DialogOverlay,
    DialogPortal,
    DialogRoot,
    DialogTitle,
} from 'reka-ui'
import { computed, useTemplateRef } from 'vue'
import { useMotionLevel } from '../../../motion'
import ModalClose from './ModalClose.vue'
import { useModalStack } from './modal-stack'
import { useModalMeasure } from './use-modal-measure'

const props = withDefaults(
    defineProps<{
        title: string
        description?: string
        closeLabel?: string
        width?: string
        dismissible?: boolean
        centered?: boolean
        clouds?: boolean
        /** No chrome: the slot is the whole dialog (a settings window); the title stays for screen readers. */
        bare?: boolean
        modal?: boolean
    }>(),
    { dismissible: true, modal: undefined },
)

const open = defineModel<boolean>('open', { default: false })

// Back cards adopt the top card's size; deeper cards hide.
const LAYER_PEEK_PX = 16
const LAYER_SHRINK_PX = 32
const LAYER_MIN_HEIGHT_PX = 64
const LAYER_SCALE = 0.95
const LAYER_FADE = 0.6
const LAYER_MAX_VISIBLE_BEHIND = 2

const {
    above,
    layer,
    ownsOverlay,
    animateOverlayIn,
    setSize,
    topWidth,
    topHeight,
} = useModalStack(open)

const level = useMotionLevel()
const wrapper = useTemplateRef('wrapper')
const panel = useTemplateRef('panel')
const content = useTemplateRef('content')

const { ownWidth, ownHeight, clipping } = useModalMeasure({
    open,
    above,
    wrapper,
    panel,
    content,
    setSize,
})

const layerStyle = computed(() => {
    // Pixel heights keep stack transitions interpolable.
    if (above.value === 0) {
        if (ownHeight.value === 0) return undefined
        return {
            height: `${ownHeight.value}px`,
            '--fp-modal-opacity': '1',
        }
    }
    // Simple stacks no cards: the lower panel fades out at its own size, never reflowing to the top card.
    if (level.value === 'simple') {
        const style: Record<string, string> = { '--fp-modal-opacity': '0' }
        if (ownHeight.value > 0) style.height = `${ownHeight.value}px`
        return style
    }
    const scale = LAYER_SCALE ** above.value
    const style: Record<string, string> = {
        transform: `translateY(${above.value * -LAYER_PEEK_PX}px) scale(${scale})`,
        '--fp-modal-opacity': String(LAYER_FADE ** above.value),
    }
    if (above.value > LAYER_MAX_VISIBLE_BEHIND) style.visibility = 'hidden'
    // Keep frozen height until the top card is measured; auto cannot interpolate.
    if (topWidth.value === 0 || ownWidth.value === 0) {
        if (ownHeight.value > 0) style.height = `${ownHeight.value}px`
        return style
    }
    const cardHeight = Math.max(
        topHeight.value - LAYER_SHRINK_PX * above.value,
        LAYER_MIN_HEIGHT_PX,
    )
    const lift = (cardHeight - topHeight.value) / 2 - LAYER_PEEK_PX * above.value
    style.transform = `translateY(${lift}px) scale(${scale})`
    style.width = `${topWidth.value}px`
    style.height = `${cardHeight}px`
    return style
})

function close() {
    open.value = false
}

function onEscapeKeyDown(event: KeyboardEvent) {
    if (!props.dismissible) event.preventDefault()
}

function onInteractOutside(event: CustomEvent<{ originalEvent: Event }>) {
    // Require both press and release outside.
    if (!props.dismissible || event.detail.originalEvent instanceof PointerEvent) {
        event.preventDefault()
    }
}

// The transparent clouds panel still defines the outside-dismiss boundary.
let pressedOutside = false

function isOutsidePanel(target: EventTarget | null) {
    return (
        target instanceof Node &&
        panel.value !== null &&
        !panel.value.contains(target)
    )
}

// Ignore presses retargeted through a nested overlay's disabled pointer layer.
function panelUntargetable() {
    const el = panel.value
    return el !== null && getComputedStyle(el).pointerEvents === 'none'
}

function onWrapperPointerDown(event: PointerEvent) {
    // Offsets past the client box are the wrapper scrollbar, not outside intent.
    const el = wrapper.value
    const onScrollbar =
        el !== null &&
        event.target === el &&
        (event.offsetX > el.clientWidth || event.offsetY > el.clientHeight)
    pressedOutside =
        event.button === 0 &&
        !onScrollbar &&
        !panelUntargetable() &&
        isOutsidePanel(event.target)
}

function onWrapperPointerUp(event: PointerEvent) {
    const shouldClose =
        pressedOutside && props.dismissible && isOutsidePanel(event.target)
    pressedOutside = false
    if (shouldClose) close()
}
</script>

<template>
    <DialogRoot v-model:open="open" :modal="modal">
        <DialogPortal>
            <DialogOverlay
                class="group/overlay fixed inset-0 data-[state=closed]:animate-presence-hold"
                :style="{ zIndex: `calc(var(--layer-overlay) + ${layer})` }">
                <div
                    v-if="ownsOverlay"
                    class="bg-scrim fixed inset-0 group-data-[state=closed]/overlay:animate-overlay-out"
                    :class="
                        animateOverlayIn &&
                        'group-data-[state=open]/overlay:animate-overlay-in'
                    "
                    aria-hidden="true" />
                <div
                    ref="wrapper"
                    class="fixed inset-0 overflow-y-auto scrollbar-gutter-both safe-p"
                    @pointerdown="onWrapperPointerDown"
                    @pointerup="onWrapperPointerUp">
                    <div class="flex min-h-full items-center justify-center py-6">
                    <DialogContent
                        class="fp-modal-shell shell flex w-[min(92vw,28rem)] justify-center outline-none"
                        :style="width ? { width } : undefined"
                        v-bind="description ? {} : { 'aria-describedby': undefined }"
                        @escape-key-down="onEscapeKeyDown"
                        @interact-outside="onInteractOutside">
                        <div
                            ref="panel"
                            class="fp-modal-panel panel w-full shrink-0 origin-top duration-slow ease-spring"
                            :class="[
                                clouds
                                    ? 'fp-modal-clouds relative rounded-xl transition-[transform,width,height]'
                                    : 'surface-pop relative rounded-xl transition-[transform,opacity,width,height]',
                                above > 0 && 'pointer-events-none',
                                bare && 'overflow-hidden',
                                clipping && 'overflow-clip',
                            ]"
                            :style="layerStyle">
                            <template v-if="clouds">
                                <slot name="hero" />
                                <div class="surface-pop sticky top-2 z-10 rounded-xl px-4 py-2.5">
                                    <DialogTitle class="font-semibold text-17" :class="(dismissible || $slots.close) && 'pr-10'">
                                        {{ title }}
                                    </DialogTitle>
                                    <DialogDescription v-if="description" class="mt-1 text-13 text-fg-3">
                                        {{ description }}
                                    </DialogDescription>
                                    <slot name="header" />
                                    <slot name="close" :close="close">
                                        <ModalClose
                                            v-if="dismissible"
                                            class="absolute top-2 right-2"
                                            :label="closeLabel" />
                                    </slot>
                                </div>
                                <div ref="content" class="mt-3">
                                    <slot />
                                </div>
                            </template>
                            <div v-else-if="bare" ref="content">
                                <DialogTitle class="sr-only">{{ title }}</DialogTitle>
                                <DialogDescription v-if="description" class="sr-only">
                                    {{ description }}
                                </DialogDescription>
                                <slot />
                            </div>
                            <template v-else>
                                <div class="flex items-start justify-between gap-2.5 pt-4 pr-4 pb-1 pl-5">
                                    <div class="min-w-0 flex-1" :class="centered && 'text-center'">
                                        <slot name="hero" />
                                        <DialogTitle class="font-semibold text-17">{{ title }}</DialogTitle>
                                        <DialogDescription v-if="description" class="mt-1 text-13 text-fg-3">
                                            {{ description }}
                                        </DialogDescription>
                                    </div>
                                    <slot name="close" :close="close">
                                        <ModalClose
                                            v-if="dismissible"
                                            :class="centered ? 'absolute top-3 right-3' : ''"
                                            :label="closeLabel" />
                                    </slot>
                                </div>
                                <div ref="content" class="px-5 pt-3 pb-5">
                                    <slot />
                                </div>
                                <div
                                    v-if="$slots.footer || $slots['footer-start']"
                                    class="flex items-center justify-between gap-4 border-stroke-1 border-t py-3 pr-4 pl-5">
                                    <div class="min-w-0">
                                        <slot name="footer-start" />
                                    </div>
                                    <div class="flex shrink-0 gap-2">
                                        <slot name="footer" />
                                    </div>
                                </div>
                            </template>
                        </div>
                    </DialogContent>
                    </div>
                </div>
            </DialogOverlay>
        </DialogPortal>
    </DialogRoot>
</template>

<style scoped>
/* The shell only transforms. Fades stay on glass surfaces so blur remains live. */
.shell[data-state='open'] {
    animation: modal-in var(--dur-slow) var(--ease-spring);
}
.shell[data-state='closed'] {
    animation: modal-out var(--dur-fast) var(--ease-out);
}
.panel:not(.fp-modal-clouds) {
    opacity: var(--fp-modal-opacity, 1);
}
.shell[data-state='open'] .panel:not(.fp-modal-clouds) {
    animation: fade-in var(--dur-base) var(--ease-out);
}
.shell[data-state='closed'] .panel:not(.fp-modal-clouds) {
    animation: fade-out var(--dur-fast) var(--ease-out);
}
@keyframes modal-in {
    from {
        transform: translateY(8px) scale(0.96);
    }
}
@keyframes modal-out {
    to {
        transform: translateY(4px) scale(0.98);
    }
}
</style>

<style>
/* ViewStack owns the height during a swap (tween or snap); a second spring would lag its content. */
.fp-modal-panel:has([data-fp-view-swapping]) {
    transition-property: transform, opacity, width;
}

.fp-modal-panel.fp-modal-clouds .surface-pop {
    opacity: var(--fp-modal-opacity, 1);
    transition: opacity var(--dur-slow) var(--ease-spring);
}
.fp-modal-shell[data-state='open'] .fp-modal-panel.fp-modal-clouds .surface-pop {
    animation: fade-in var(--dur-base) var(--ease-out);
}
.fp-modal-shell[data-state='closed'] .fp-modal-panel.fp-modal-clouds .surface-pop {
    animation: fade-out var(--dur-fast) var(--ease-out);
}
</style>
