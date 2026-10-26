<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import Toast from './Toast.vue'
import { useToast } from './toast'

withDefaults(
    defineProps<{
        duration?: number
        /** Names the region for screen readers. */
        label?: string
        /** Names the close button of each toast. */
        dismissLabel?: string
    }>(),
    { duration: 5000, label: 'Notifications', dismissLabel: 'Dismiss' },
)

const { toasts, remove } = useToast()

const hidden = ref(document.hidden)
const onVisibility = () => (hidden.value = document.hidden)
document.addEventListener('visibilitychange', onVisibility)
onBeforeUnmount(() => document.removeEventListener('visibilitychange', onVisibility))

// Out of the flow at its spot, measured from the bottom the list grows from, so the others slide into its place.
function pin(el: Element) {
    const toast = el as HTMLElement
    const list = toast.offsetParent as HTMLElement
    toast.style.bottom = `${list.offsetHeight - toast.offsetTop - toast.offsetHeight}px`
    toast.style.width = `${toast.offsetWidth}px`
    toast.style.position = 'absolute'
}
</script>

<!-- A column at the corner, newest nearest the edge; on phones it spans the width above the dock (`--toast-offset-bottom`). -->
<template>
    <TransitionGroup
        tag="ol"
        :aria-label="label"
        aria-live="polite"
        class="toaster pointer-events-none fixed bottom-0 layer-toast flex flex-col gap-2 p-4 max-lg:inset-x-0 lg:right-0 lg:w-103"
        enter-active-class="transition-[opacity,translate] duration-base ease-out"
        enter-from-class="opacity-0 max-lg:translate-y-4 lg:translate-x-4"
        leave-active-class="transition-[opacity,translate] duration-fast ease-in"
        leave-to-class="opacity-0 max-lg:translate-y-2 lg:translate-x-2"
        move-class="transition-transform duration-base ease-out"
        @before-leave="pin">
        <Toast
            v-for="toast in toasts"
            :key="toast.id"
            :toast="toast"
            :duration="duration"
            :hidden="hidden"
            :dismiss-label="dismissLabel"
            @dismiss="remove(toast.id)" />
    </TransitionGroup>
</template>

<style scoped>
.toaster {
    margin: var(--safe-top) var(--safe-right) calc(var(--safe-bottom) + var(--toast-offset-bottom, 0px)) var(--safe-left);
}
</style>
