<script setup lang="ts">
import { useRouteMotion } from '../composables/useRouteMotion'

const motion = useRouteMotion()
</script>

<template>
    <div class="stage" :data-motion="motion.kind.value" :style="motion.style.value">
        <RouterView v-slot="{ Component, route }">
            <!-- Without a motion the pages swap at once: no frame with both in the flow. -->
            <Transition name="page" :css="motion.animated.value" v-bind="motion.hooks">
                <div :key="route.path">
                    <component :is="Component" />
                </div>
            </Transition>
        </RouterView>
    </div>
</template>

<!-- Pages move, never fade, on Flat; a fading page drops its glass blur for the fade (ancestor opacity). -->
<style scoped>
.stage {
    position: relative;
    overflow: clip;
}
/* A short entering page would clip the move: the stage spans the viewport while pages switch. */
.stage[data-motion] {
    min-height: var(--page-h);
}
.stage > .page-leave-active {
    position: absolute;
    inset-inline: 0;
}

.stage:is([data-motion^='slide'], [data-motion='drill']) > :is(.page-enter-active, .page-leave-active) {
    transition: translate var(--dur-slow) var(--ease-move);
}
.stage[data-motion='slide-y'] > .page-enter-from {
    translate: 0 calc(var(--route-dir) * var(--page-h));
}
.stage[data-motion='slide-y'] > .page-leave-to {
    translate: 0 calc(var(--route-dir) * var(--page-h) * -1);
}
.stage:is([data-motion='slide-x'], [data-motion='drill']) > .page-enter-from {
    translate: calc(var(--route-dir) * 100%) 0;
}
.stage:is([data-motion='slide-x'], [data-motion='drill']) > .page-leave-to {
    translate: calc(var(--route-dir) * -100%) 0;
}

.stage[data-motion^='shift'] > .page-enter-active {
    transition:
        translate var(--dur-base) var(--ease-out),
        opacity var(--dur-base) var(--ease-out);
}
.stage[data-motion^='shift'] > .page-leave-active {
    transition: opacity var(--dur-fast) var(--ease-in);
}
.stage[data-motion='shift-y'] > .page-enter-from {
    translate: 0 calc(var(--route-dir) * 1.5rem);
    opacity: 0;
}
.stage[data-motion='shift-x'] > .page-enter-from {
    translate: calc(var(--route-dir) * 1.5rem) 0;
    opacity: 0;
}
.stage[data-motion^='shift'] > .page-leave-to {
    opacity: 0;
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
    /* The card's own surface: --surf-pop is opaque and tinted under Subtle and Glass. */
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
