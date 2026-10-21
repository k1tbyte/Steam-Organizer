<script setup lang="ts">
import { ProgressIndicator, ProgressRoot } from 'reka-ui'
import { computed } from 'vue'

defineOptions({ inheritAttrs: false })

type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(
    defineProps<{
        max?: number
        size?: Size
        status?: boolean
    }>(),
    { max: 100, size: 'md' },
)

const value = defineModel<number | null>({ default: null })

const SIZES: Record<Size, string> = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
}

const safeMax = computed(() =>
    Number.isFinite(props.max) && props.max > 0 ? props.max : 100,
)
const safeValue = computed(() => {
    if (value.value === null) return null
    if (!Number.isFinite(value.value)) return 0
    return Math.min(Math.max(value.value, 0), safeMax.value)
})

const percent = computed(() => {
    if (safeValue.value === null) return null
    return Math.round((safeValue.value / safeMax.value) * 100)
})
</script>

<template>
    <div class="flex w-full flex-col gap-1">
        <div v-if="status && percent !== null" class="text-right text-12 text-fg-3">{{ percent }}%</div>
        <ProgressRoot
            v-bind="$attrs"
            :model-value="safeValue"
            :max="safeMax"
            class="relative w-full overflow-hidden rounded-full bg-surface-hi"
            :class="SIZES[size]">
            <ProgressIndicator
                class="h-full w-full rounded-full bg-accent transition-transform duration-base ease-out"
                :class="percent === null && 'indeterminate motion-off:animate-pulse!'"
                :style="percent !== null ? { transform: `translateX(-${100 - percent}%)` } : undefined" />
        </ProgressRoot>
    </div>
</template>

<style scoped>
.indeterminate {
    width: 40%;
    animation: progress-slide var(--dur-cycle) var(--ease-in-out) infinite;
}
@keyframes progress-slide {
    from {
        transform: translateX(-100%);
    }
    to {
        transform: translateX(350%);
    }
}
</style>
