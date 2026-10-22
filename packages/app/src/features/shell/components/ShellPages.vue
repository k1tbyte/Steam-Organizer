<script setup lang="ts">
import { useTemplateRef } from 'vue'

import type { PageContext } from '#core'

import { useShellLayers } from '../composables/useShellLayers'
import ShellLayer from './ShellLayer.vue'

const page = defineModel<Pick<PageContext, 'scroller' | 'top'> | null>('page')
const stage = useTemplateRef('stage')
const { layers, stateOf, kind, style } = useShellLayers(stage)
</script>

<template>
    <div ref="stage" class="stage" :data-page-motion="kind" :style="style">
        <ShellLayer
            v-for="layer in layers"
            :key="layer.key"
            :route="layer.route"
            :state="stateOf(layer.key)"
            @page="page = $event" />
    </div>
</template>

<!-- Gamify pages move, never fade; a Simple page drops its glass blur for its fade (ancestor opacity). -->
<style scoped>
.stage {
    position: relative;
    height: 100%;
    overflow: clip;
}
/* Kept with its layout and offsets, but no style, layout or paint work while hidden. */
.stage > [data-layer='hidden'] {
    content-visibility: hidden;
}

.stage:is([data-page-motion^='slide'], [data-page-motion='drill']) > [data-layer='enter'] {
    animation: page-move-in var(--dur-slow) var(--ease-move);
}
.stage:is([data-page-motion^='slide'], [data-page-motion='drill']) > [data-layer='leave'] {
    animation: page-move-out var(--dur-slow) var(--ease-move) forwards;
}
.stage[data-page-motion^='shift'] > [data-layer='enter'] {
    animation: page-shift-in var(--dur-base) var(--ease-out);
}
.stage[data-page-motion^='shift'] > [data-layer='leave'] {
    animation: page-fade-out var(--dur-fast) var(--ease-in) forwards;
}

.stage[data-page-motion='slide-y'] {
    --page-from: 0 calc(var(--route-dir) * 100%);
    --page-to: 0 calc(var(--route-dir) * -100%);
}
.stage:is([data-page-motion='slide-x'], [data-page-motion='drill']) {
    --page-from: calc(var(--route-dir) * 100%) 0;
    --page-to: calc(var(--route-dir) * -100%) 0;
}
.stage[data-page-motion='shift-y'] {
    --page-from: 0 calc(var(--route-dir) * var(--shift-travel));
}
.stage[data-page-motion='shift-x'] {
    --page-from: calc(var(--route-dir) * var(--shift-travel)) 0;
}

@keyframes page-move-in {
    from {
        translate: var(--page-from);
    }
}
@keyframes page-move-out {
    to {
        translate: var(--page-to);
    }
}
@keyframes page-shift-in {
    from {
        translate: var(--page-from);
        opacity: 0;
    }
}
@keyframes page-fade-out {
    to {
        opacity: 0;
    }
}
</style>

<!-- The hero morph (View Transitions): the list card and the detail page's top surface share one name, only while it runs. A named element is a backdrop root, so at rest it would cut its glass off from the stage. -->
<style>
html[data-route-motion^='hero'] [data-vt-hero] {
    view-transition-name: account-hero;
    /* The group paints the surface once; the snapshots carry only content. */
    background: transparent;
}
html[data-route-motion^='hero']::view-transition-old(root),
html[data-route-motion^='hero']::view-transition-new(root) {
    mix-blend-mode: normal;
}
html[data-route-motion^='hero']::view-transition-old(root) {
    animation: none;
}
html[data-route-motion^='hero']::view-transition-new(root) {
    animation: hero-in var(--dur-base) var(--ease-out) var(--dur-fast) backwards;
}
html[data-route-motion^='hero']::view-transition-group(account-hero) {
    overflow: clip;
    border-radius: var(--radius-lg);
    /* The card's own surface, not the float tint of --surf-pop. */
    background: var(--surf-bg);
    backdrop-filter: var(--surf-filter);
    animation-duration: var(--dur-slow);
    animation-timing-function: var(--ease-move);
}
html[data-route-motion='hero-close']::view-transition-group(account-hero) {
    animation-duration: var(--dur-base);
}
/* Content is revealed as the box grows, never stretched. */
html[data-route-motion^='hero']::view-transition-old(account-hero),
html[data-route-motion^='hero']::view-transition-new(account-hero) {
    block-size: 100%;
    object-fit: none;
    object-position: left top;
    mix-blend-mode: normal;
}
html[data-route-motion^='hero']::view-transition-old(account-hero) {
    animation: hero-out var(--dur-press) var(--ease-in) both;
}
html[data-route-motion^='hero']::view-transition-new(account-hero) {
    animation: hero-in var(--dur-fast) var(--ease-out) var(--dur-fast) backwards;
}
html[data-route-motion='hero-close']::view-transition-new(account-hero) {
    animation-delay: 0s;
}
@keyframes hero-in {
    from {
        opacity: 0;
    }
}
@keyframes hero-out {
    to {
        opacity: 0;
    }
}
</style>
