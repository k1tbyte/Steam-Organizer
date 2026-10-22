<script setup lang="ts">
import {
    DrawerContent,
    DrawerDescription,
    DrawerHandle,
    DrawerOverlay,
    DrawerPortal,
    DrawerRoot,
    DrawerTitle,
    DrawerTrigger,
} from 'reka-ui'
import { useOpenedOnce } from '../../composables/useOpenedOnce'
import { useOverlayGate } from '../../composables/useOverlayGate'

const props = withDefaults(
    defineProps<{
        title: string
        description?: string
        dismissible?: boolean
        /** Title for assistive tech only; the slot brings its own heading and padding. */
        bare?: boolean
    }>(),
    { dismissible: true },
)

const open = defineModel<boolean>('open', { default: false })
useOverlayGate(open)
const opened = useOpenedOnce(open)

// A non-dismissible sheet refuses every user close (swipe, outside press, Escape).
function onOpenChange(value: boolean, details?: { cancel(): void }) {
    if (!value && !props.dismissible) return details?.cancel()
    open.value = value
}
</script>

<template>
    <DrawerRoot :open="open" @update:open="onOpenChange">
        <DrawerTrigger v-if="$slots.trigger" as-child>
            <slot name="trigger" />
        </DrawerTrigger>
        <DrawerPortal v-if="opened">
            <DrawerOverlay class="overlay bg-scrim fixed inset-0 layer-overlay" />
            <DrawerContent
                class="drawer surface-pop fixed inset-x-0 bottom-0 layer-overlay flex max-h-[92dvh] flex-col rounded-t-2xl safe-px safe-pb"
                :aria-describedby="description ? undefined : ''">
                <DrawerHandle class="mx-auto mt-2.5 h-1 w-9 shrink-0 cursor-grab rounded-full bg-stroke-2" />
                <header :class="bare ? 'sr-only' : 'px-6 pt-4'">
                    <DrawerTitle class="font-semibold text-fg-1 text-17">{{ title }}</DrawerTitle>
                    <DrawerDescription v-if="description" class="mt-1 text-fg-3 text-13">
                        {{ description }}
                    </DrawerDescription>
                </header>
                <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain" :class="{ 'p-6': !bare }">
                    <slot />
                </div>
                <footer v-if="$slots.footer" class="flex justify-end gap-2 p-6 pt-0">
                    <slot name="footer" />
                </footer>
            </DrawerContent>
        </DrawerPortal>
    </DrawerRoot>
</template>

<style scoped>
/* The sheet follows the finger down only: pulling it up showed nothing but a cut edge.
   Enter and exit use translate so they compose with the swipe transform. */
.drawer {
    box-shadow: inset 0 1px 0 var(--stroke-2);
    transform: translateY(max(0px, var(--drawer-swipe-movement-y, 0px)));
    transition: transform var(--dur-slow) var(--ease-out);
}
.drawer[data-swiping] {
    transition-duration: 0ms;
}
.drawer[data-state='open'] {
    animation: fp-drawer-in var(--dur-slow) var(--ease-out);
}
.drawer[data-state='closed'] {
    animation: fp-drawer-out var(--dur-base) var(--ease-in) forwards;
}
.overlay[data-state='open'] {
    animation: var(--animate-overlay-in);
}
.overlay[data-state='closed'] {
    animation: var(--animate-overlay-out);
}

@keyframes fp-drawer-in {
    from {
        translate: 0 100%;
    }
}

@keyframes fp-drawer-out {
    to {
        translate: 0 100%;
    }
}
</style>
