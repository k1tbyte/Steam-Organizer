<script setup lang="ts">
import { Label, SwitchRoot, SwitchThumb } from 'reka-ui'
import { ref, useId } from 'vue'

type Size = 'sm' | 'md' | 'lg'

withDefaults(
    defineProps<{
        label?: string
        description?: string
        size?: Size
        disabled?: boolean
        ariaLabel?: string
    }>(),
    { size: 'md' },
)

const checked = defineModel<boolean>({ default: false })
const id = useId()

// Squash only for the toggle a user caused, never for programmatic changes.
const engaged = ref(false)

const SIZES: Record<Size, { track: string; thumb: string; travel: string; label: string; hint: string }> = {
    sm: { track: 'h-4 w-7', thumb: 'size-3', travel: '12px', label: 'text-13', hint: 'text-12' },
    md: { track: 'h-5 w-9', thumb: 'size-4', travel: '16px', label: 'text-14', hint: 'text-12.5' },
    lg: { track: 'h-6 w-11', thumb: 'size-5', travel: '20px', label: 'text-15.5', hint: 'text-14' },
}
</script>

<template>
    <div class="flex items-center gap-6" :class="(label || description) && 'w-full'">
        <div v-if="label || description" class="flex min-w-0 flex-1 flex-col gap-0.5">
            <Label :for="id" class="font-medium text-fg-1" :class="SIZES[size].label">{{ label }}</Label>
            <p v-if="description" class="text-fg-3" :class="SIZES[size].hint">{{ description }}</p>
        </div>
        <SwitchRoot
            :id="id"
            v-model="checked"
            :disabled="disabled"
            :aria-label="ariaLabel"
            class="track touch-target inline-flex shrink-0 items-center rounded-full p-0.5 transition-colors duration-base data-[state=checked]:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
            :class="[SIZES[size].track, engaged && 'goo']"
            :style="{ '--sw-travel': SIZES[size].travel }"
            @click="engaged = true">
            <SwitchThumb
                class="thumb pointer-events-none block rounded-full"
                :class="SIZES[size].thumb"
                @animationend="engaged = false" />
        </SwitchRoot>
    </div>
</template>

<style scoped>
.thumb {
    background: var(--text-1);
    box-shadow: 0 1px 3px color-mix(in oklch, black 30%, transparent);
    transition:
        translate var(--dur-base) var(--ease-spring),
        background var(--dur-base) var(--ease-out);
}
.track[data-state='unchecked'] {
    background: var(--surf-bg-hi);
    box-shadow: inset 0 0 0 1px var(--stroke-2);
}
.track[data-state='checked'] .thumb {
    translate: var(--sw-travel);
    background: var(--accent-fg);
}

.goo[data-state='checked'] .thumb {
    transform-origin: 100% 50%;
    animation: sw-goo-on var(--dur-base) var(--ease-out);
}
.goo[data-state='unchecked'] .thumb {
    transform-origin: 0% 50%;
    animation: sw-goo-off var(--dur-base) var(--ease-out);
}

@keyframes sw-goo-on {
    40% {
        transform: scaleX(1.8) scaleY(0.92);
    }
    100% {
        transform: scaleX(1) scaleY(1);
    }
}
@keyframes sw-goo-off {
    40% {
        transform: scaleX(1.8) scaleY(0.92);
    }
    100% {
        transform: scaleX(1) scaleY(1);
    }
}
</style>
