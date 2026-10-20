<script setup lang="ts" generic="T extends string | number, M extends boolean = false">
import type { AcceptableValue } from 'reka-ui'
import { ToggleGroupItem, ToggleGroupRoot } from 'reka-ui'
import { computed } from 'vue'
import { type FieldSize, type Option, toOption } from '../field'

export type ToggleOption<T extends string | number = string | number> = Option<T>
type Model = M extends true ? T[] : T

const props = withDefaults(
    defineProps<{
        items: (ToggleOption<T> | T)[]
        modelValue?: Model
        multiple?: M
    size?: FieldSize
        /** Fill the container, splitting the width evenly between the items. */
        block?: boolean
        disabled?: boolean
    }>(),
    { size: 'md' },
)

const emit = defineEmits<{ 'update:modelValue': [value: Model] }>()

/** Keep one item selected when reka tries to clear the current value. */
function onUpdate(value: AcceptableValue | AcceptableValue[] | undefined) {
    if (value === undefined) return
    emit('update:modelValue', value as Model)
}

const normalized = computed<ToggleOption<T>[]>(() => props.items.map(toOption))

// A generic prop gets no Boolean casting, so a bare `multiple` arrives as ''.
const isMultiple = computed(() => props.multiple !== undefined && props.multiple !== false)

const SIZES: Record<FieldSize, string> = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-1.5 text-sm',
    lg: 'px-5 py-2 text-base',
}

// The track takes the control height, so a segmented row lines up with buttons and fields.
const TRACK: Record<FieldSize, string> = {
    sm: 'touch-control-sm',
    md: 'touch-control-md',
    lg: 'touch-control-lg',
}
</script>

<!-- Segments grow, so a track stretched by its parent (a stacked form row) is filled, not left half empty. -->
<template>
    <ToggleGroupRoot
        :model-value="modelValue"
        :type="isMultiple ? 'multiple' : 'single'"
        @update:model-value="onUpdate"
        :disabled="disabled"
        class="max-w-full items-stretch gap-1 rounded bg-surface-lo p-1"
        :class="[TRACK[size], block ? 'flex w-full flex-nowrap' : 'inline-flex flex-wrap']">
        <ToggleGroupItem
            v-for="option in normalized"
            :key="option.value"
            :value="option.value"
            :disabled="option.disabled"
            class="seg inline-flex grow cursor-pointer items-center justify-center gap-1.5 rounded font-medium text-fg-3 transition-colors duration-fast data-[state=on]:text-fg-1 hover:not-disabled:data-[state=off]:text-fg-2 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            :class="[SIZES[size], block && 'min-w-0 basis-0']">
            <slot :option="option">{{ option.label }}</slot>
        </ToggleGroupItem>
    </ToggleGroupRoot>
</template>

<style scoped>
.seg[data-state='on'] {
    background: var(--surf-bg-hi);
    box-shadow:
        0 0 0 1px var(--stroke-2),
        0 1px 0 color-mix(in oklch, white 10%, transparent) inset,
        0 2px 8px -2px color-mix(in oklch, black 40%, transparent);
}
</style>
